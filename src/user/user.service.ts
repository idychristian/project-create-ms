import {
  HttpException,
  Injectable,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(payload: CreateUserDto) {
    payload.email = payload.email.toLowerCase();
    const {email, password, ...rest} = payload;
    const user = await this.userRepo.findOne({ where: {email: email}});
    if (user) {
      throw new HttpException('Email already exists', 400);
    }
    const hashedPassword = await argon2.hash(password);

    const userDetails = await this.userRepo.save({
      ...rest, email, password: hashedPassword
    });

    delete userDetails.password;
    const userPayload = {email: userDetails.email, id: userDetails.id};
    return {
      access_token: await this.jwtService.signAsync(userPayload),
    };
  }

  async signIn(payload: LoginDto, @Req() req: Request, @Res() res: Response) {
    const { email, password} = payload;

    const user = await this.userRepo.findOneBy({ email });

    if (!user) {
      throw new HttpException('No email found', 400)
    }

    const checkedPassword = await this.verifyPassword(user.password, password);
    if (!checkedPassword) {
      throw new HttpException('Sorry password does not exist', 400);
    }
    const token = await this.jwtService.signAsync({
      email: user.email,
      id: user.id
    });

    res.cookie('isAuthenticated', token, {
      httpOnly: true,
      maxAge: 1 * 60 * 60 * 1000
    });

    return res.send({
      success: true,
      userToken: token
    })
  }

  async logout(@Req() req: Request, @Res() res: Response) {
    const clearCookie = res.clearCookie('isAuthenticated');

    const response = res.send('User successfully logout');

    return {
      clearCookie,
      response
    }
  }

  findAll() {
    return 'This action returns all user';
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

  async verifyPassword(hashedPassword: string, plainPassword: string,): Promise<boolean> {
    try{
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (err) {
      console.log(err.message);
      return false;
    }
  }

  async findEmail(email) {
    const userEmail = await this.userRepo.findOneBy({ email });

    if (!userEmail) {
      throw new HttpException('Email already exists', 400);
    }
    return userEmail;
  }

  async user(headers: any): Promise<any> {
    const authorizationHeader = headers.authorization;
    // It tries to extract the authorization header from the incoming request headers.
    // This header typically contains the token used for authentication.
    if (authorizationHeader) {
      const token = authorizationHeader.replace('Bearer ', '');
      const secret = process.env.JWTSECRET;
      // checks if the authorization header exists. If not, it will skip to the else block
      // and throw an error.

      try {
        const decoded = this.jwtService.verify(token);
        let id = decoded['id'];
        // After verifying the token, the function extracts the user's id from the decoded token payload.

        let user = await this.userRepo.findOneBy({ id });

        return { id: id, name: user.name, email: user.email, role: user.role };
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    } else {
      throw new UnauthorizedException('Invalid or missing Bearer token');
    }
  }
}