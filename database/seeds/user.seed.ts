import { CreateUserProps } from '@/modules/users/domain/user.entity';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import * as bcrypt from 'bcrypt';

export const userSeeds: CreateUserProps[] = [
  {
    name: '관리자',
    email: Email.create('admin@example.com'),
    password: bcrypt.hashSync('admin123!', 10),
  },
  {
    name: '홍길동',
    email: Email.create('hong@example.com'),
    password: bcrypt.hashSync('user123!', 10),
  },
  {
    name: '김영희',
    email: Email.create('kim@example.com'),
    password: bcrypt.hashSync('user123!', 10),
  },
  {
    name: '박민수',
    email: Email.create('park@example.com'),
    password: bcrypt.hashSync('user123!', 10),
  },
  {
    name: '테스트 사용자1',
    email: Email.create('test1@example.com'),
    password: bcrypt.hashSync('test123!', 10),
  },
  {
    name: '테스트 사용자2',
    email: Email.create('test2@example.com'),
    password: bcrypt.hashSync('test123!', 10),
  },
  {
    name: '개발자',
    email: Email.create('dev@example.com'),
    password: bcrypt.hashSync('dev123!', 10),
  },
];

export const testCredentials = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123!',
  },
  user: {
    email: 'hong@example.com',
    password: 'user123!',
  },
  dev: {
    email: 'dev@example.com',
    password: 'dev123!',
  },
  test1: {
    email: 'test1@example.com',
    password: 'test123!',
  },
};
