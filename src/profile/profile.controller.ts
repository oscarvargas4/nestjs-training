import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ProfileResponseInterface } from "@app/profile/types/profileResponse.interface";
import { ProfileService } from "@app/profile/profile.service";
import { User } from "@app/user/decorators/user.decorator";
import { AuthGuard } from "@app/user/guards/auth.guard";

@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  ) {}

  @Get(':username')
  async findByUsername(
    @User('id') currentUserId: number,
    @Param('username') username: string
    ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.getProfile(currentUserId, username);
    return this.profileService.buildProfileResponse(profile);
  }

  @Post(':username/follow')
  @UseGuards(AuthGuard)
  async followProfile(
    @User('id') currentUserId: number,
    @Param('username') profileUsername: string
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.followProfile(currentUserId, profileUsername);
    return this.profileService.buildProfileResponse(profile);
  }

  @Delete(':username/follow')
  @UseGuards(AuthGuard)
  async unfollowProfile(
    @User('id') currentUserId: number,
    @Param('username') profileUsername: string
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.unfollowProfile(currentUserId, profileUsername);
    return this.profileService.buildProfileResponse(profile);
  }
}