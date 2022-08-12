import { UserEntity } from "@app/user/user.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProfileType } from "@app/profile/types/profile.type";
import { ProfileResponseInterface } from "@app/profile/types/profileResponse.interface";
import { FollowEntity } from "./follow.entity";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<ProfileType>,
    @InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>
  ) { }

  async getProfile(currentUserId: number, username: string): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ username });
    if (!user) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: user.id
    });

    return {
      ...user,
      following: Boolean(follow)
    };
  }

  async followProfile(currentUserId: number, username: string): Promise<any> {
    const user = await this.userRepository.findOne({ username });
    if (!user) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }

    if(currentUserId === user.id) {
      throw new HttpException('Follower and Following cannot be equal', HttpStatus.NOT_FOUND);
    }

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: user.id
    });

    if (!follow) {
      const followToCreate = new FollowEntity();
      followToCreate.followerId = currentUserId;
      followToCreate.followingId = user.id;
      await this.followRepository.save(followToCreate);
    }

    return { ...user, following: true };
  }
  
  async unfollowProfile(currentUserId: number, username: string): Promise<any> {
    const user = await this.userRepository.findOne({ username });
    if (!user) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }

    if(currentUserId === user.id) {
      throw new HttpException('Follower and Following cannot be equal', HttpStatus.NOT_FOUND);
    }
    
    await this.followRepository.delete({
      followerId: currentUserId,
      followingId: user.id
    });
    return { ...user, following: false };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    delete profile.email;
    return { profile };
  }
}