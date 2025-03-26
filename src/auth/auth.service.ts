import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as firebaseAdmin from 'firebase-admin';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { CustomUserClaimsDto } from './dto/custom-user-claims.dto';

@Injectable()
export class AuthService {
  async setCustomUserClaims(userClaims: CustomUserClaimsDto) {
    try {
      const claims = userClaims.claims;
      await firebaseAdmin
        .auth()
        .setCustomUserClaims(userClaims.userId, userClaims.claims);
    } catch (err) {
      console.error('Error setting custom user claims;', err);
      throw new Error(err);
    }
  }

  async signOut(userId: string) {
    try {
      firebaseAdmin.auth().revokeRefreshTokens(userId);
    } catch (err) {
      console.error('Error signing out;', err);
      throw new Error(err);
    }
  }

  async refreshAuthToken(refreshToken: string) {
    try {
      const {
        id_token: idToken,
        refresh_token: newRefreshToken,
        expires_in: expiresIn,
      } = await this.sendRefreshAuthTokenRequest(refreshToken);
      return {
        idToken,
        refreshToken: newRefreshToken,
        expiresIn,
      };
    } catch (error: any) {
      if (error.message.includes('INVALID_REFRESH_TOKEN')) {
        throw new Error(`Invalid refresh token: ${refreshToken}.`);
      } else {
        throw new Error('Failed to refresh token');
      }
    }
  }

  private async sendRefreshAuthTokenRequest(refreshToken: string) {
    // TODO: extract Google Secret client to it's own service / helper
    try {
      const client = new SecretManagerServiceClient();
      const [version] = await client.accessSecretVersion({
        name: `projects/667270001960/secrets/firebase-web-api-key/versions/1`,
      });
      const apiKey = version.payload?.data?.toString();
      if (!apiKey) {
        throw new Error('Secret payload is empty.');
      }
      const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
      const payload = {
        grant_type: 'refresh_token',
        refreshToken: refreshToken,
      };
      return await this.sendPostRequest(url, payload);
    } catch (err) {
      console.error('Error retrieving secret & refreshing auth token:', err);
      throw err;
    }
  }

  async validateRequest(req: any): Promise<boolean> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      console.log('Authorization header not provided.');
      return false;
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      console.log('Invalid authorization format. Expected "Bearer <token>".');
      return false;
    }

    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      console.log('Decoded Token:', decodedToken);
      return true;
    } catch (err) {
      if (err.code === 'auth/id-token-expired') {
        console.error('Token has expired.');
      } else if (err.code === 'auth/invalid-id-token') {
        console.error('Invalid ID token provided.');
      } else {
        console.error('Error verifying token:', err);
      }
      return false;
    }
  }

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
    // TODO: extract Google Secret client to it's own service / helper
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
      console.error('Error retrieving secret & signing in:', err);
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
}
