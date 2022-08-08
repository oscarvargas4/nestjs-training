import { Injectable } from "@nestjs/common";

@Injectable()
export class UserService {
  async createUser() {
    return 'create user from service'
  }
}