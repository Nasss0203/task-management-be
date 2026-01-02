import { genSaltSync, hashSync } from 'bcrypt';

const hashPassword = (password: string) => {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  return hash;
};

export { hashPassword };
