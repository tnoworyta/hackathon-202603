import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { Static } from "@sinclair/typebox";
import { FileInterceptor } from "@nestjs/platform-express";
import { Validate } from "nestjs-typebox";
import {
  baseResponse,
  BaseResponse,
  nullResponse,
  StringSchema,
} from "src/common";
import {
  UpdateUserBody,
  updateUserSchema,
} from "../schemas/update-user.schema";
import {
  AllUsersResponse,
  allUsersSchema,
  UserResponse,
} from "../schemas/user.schema";
import { UsersService } from "../users.service";
import { commonUserSchema } from "src/common/schemas/common-user.schema";
import { Session, UserSession } from "src/auth";
import { memoryStorage } from "multer";
import type { Express } from "express";

@Controller({
  path: "users",
  version: '1'
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getProfile(@Session() session: UserSession) {
    return session;
  }

  @Get("me/alert-email")
  async scheduleAlertEmail(@Session() session: UserSession) {
    await this.usersService.scheduleAlertEmail(session.user.email);
  }

  @Get()
  @Validate({
    response: baseResponse(allUsersSchema),
  })
  async getUsers(): Promise<BaseResponse<AllUsersResponse>> {
    const users = await this.usersService.getUsers();

    return new BaseResponse(users);
  }

  @Get(":id")
  @Validate({
    request: [{ type: "param", name: "id", schema: StringSchema }],
    response: baseResponse(commonUserSchema),
  })
  async getUserById(id: string): Promise<BaseResponse<UserResponse>> {
    const user = await this.usersService.getUserById(id);

    return new BaseResponse(user);
  }

  @Post(":id/image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Validate({
    response: baseResponse(commonUserSchema),
    request: [{ type: "param", name: "id", schema: StringSchema }],
  })
  async uploadUserImage(
    id: string,
    @UploadedFile() file: Express.Multer.File,
    @Session() session: UserSession,
  ): Promise<BaseResponse<Static<typeof commonUserSchema>>> {
    if (session.user.id !== id) {
      throw new ForbiddenException("You can only update your own account");
    }

    const updatedUser = await this.usersService.uploadUserImage(id, file);

    return new BaseResponse(updatedUser);
  }

  @Patch(":id")
  @Validate({
    response: baseResponse(commonUserSchema),
    request: [
      { type: "param", name: "id", schema: StringSchema },
      { type: "body", schema: updateUserSchema },
    ],
  })
  async updateUser(
    id: string,
    @Body() data: UpdateUserBody,
    @Session() session: UserSession,
  ): Promise<BaseResponse<Static<typeof commonUserSchema>>> {
    const isAdmin = session.user.role === "admin";
    const isOwnUser = session.user.id === id;

    if (!isOwnUser && !isAdmin) {
      throw new ForbiddenException("You can only update your own account");
    }

    if (!isAdmin) {
      if (data.banned !== undefined || data.banReason !== undefined || data.banExpires !== undefined) {
        throw new ForbiddenException("Only admins can edit ban settings");
      }
    }

    let parsedBanExpires: Date | null | undefined = undefined;
    if (data.banExpires !== undefined) {
      if (data.banExpires === null) {
        parsedBanExpires = null;
      } else {
        const parsedDate = new Date(data.banExpires);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new BadRequestException("banExpires must be a valid ISO date-time string");
        }
        parsedBanExpires = parsedDate;
      }
    }

    const updatedUser = await this.usersService.updateUser(id, {
      name: data.name,
      email: data.email,
      banned: data.banned,
      banReason: data.banReason,
      banExpires: parsedBanExpires,
    });

    return new BaseResponse(updatedUser);
  }

  @Delete(":id")
  @Validate({
    response: nullResponse(),
    request: [{ type: "param", name: "id", schema: StringSchema }],
  })
  async deleteUser(id: string, @Session() session: UserSession): Promise<null> {
    if (session.user.id !== id) {
      throw new ForbiddenException("You can only delete your own account");
    }

    await this.usersService.deleteUser(id);

    return null;
  }
}
