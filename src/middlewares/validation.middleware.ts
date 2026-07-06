import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import { HttpException } from '@exceptions/HttpException';

const collectMessages = (error: ValidationError): string[] => {
  const messages: string[] = [];

  if (error.constraints) {
    messages.push(...Object.values(error.constraints));
  }

  if (error.children && error.children.length > 0) {
    for (const child of error.children) {
      messages.push(...collectMessages(child));
    }
  }

  return messages;
};

const validationMiddleware = (
  type: any,
  value: string | 'body' | 'query' | 'params' = 'body',
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true,
): RequestHandler => {
  return (req, res, next) => {
    const object = plainToClass(type, req[value]);

    validate(object, { skipMissingProperties, whitelist, forbidNonWhitelisted }).then(
      (errors: ValidationError[]) => {
        if (errors.length > 0) {
          const messages = errors.flatMap(err => collectMessages(err)).filter(Boolean);
          const message = messages.length ? messages.join(', ') : 'Validation failed';
          next(new HttpException(400, message));
        } else {
          next();
        }
      },
    );
  };
};

export default validationMiddleware;
