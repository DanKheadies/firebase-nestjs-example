import { Injectable } from '@nestjs/common';
import * as firebaseAdmin from 'firebase-admin';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from '../auth/dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import axios from 'axios';

@Injectable()
export class UserService {
  async loginUser(payload: LoginDto) {
    const { email, password } = payload;

    try {
      const { idToken, refreshToken, expiresIn } =
        await this.signInWithEmailAndPassword(email, password);
      return { idToken, refreshToken, expiresIn };
    } catch (error: any) {
      if (error.message.includes('EMAIL_NOT_FOUND')) {
        throw new Error('User not found.');
      } else if (error.message.includes('INVALID_PASSWORD')) {
        throw new Error('Invalid password');
      } else {
        throw new Error(error.message);
      }
    }
  }

  private async signInWithEmailAndPassword(email: string, password: string) {
    try {
      const client = new SecretManagerServiceClient();
      const [version] = await client.accessSecretVersion({
        name: `projects/667270001960/secrets/firebase-web-api-key/versions/1`,
      });
      const apiKey = version.payload?.data?.toString();
      if (!apiKey) {
        throw new Error('Secret payload is empty.');
      }
      // const apiKey = JSON.parse(secretPayload);
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
      return await this.sendPostRequest(url, {
        email,
        password,
        returnSecureToken: true,
      });
    } catch (err) {
      console.error('Error retrieving secret:', err);
      throw err;
    }
  }

  private async sendPostRequest(url: string, data: any) {
    try {
      const response = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (err) {
      console.log('error', err);
    }
  }

  async registerUser(registerUser: RegisterUserDto) {
    console.log(registerUser);
    try {
      const userRecord = await firebaseAdmin.auth().createUser({
        displayName: registerUser.firstName,
        email: registerUser.email,
        password: registerUser.password,
      });

      console.log('User Record:', userRecord);
      return userRecord;
    } catch (err) {
      console.error('Error creating user:', err);
      throw new Error('User registration failed');
    }
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
