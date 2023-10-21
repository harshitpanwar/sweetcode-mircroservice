import { Injectable } from '@nestjs/common';
import { codeExecutionSchema } from './app.types';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  };

  executeCode(inputs: unknown): string {

    try {

      //check if inputs are valid
      codeExecutionSchema.parse(inputs);



      return 'Hello World!';
  
    } catch (error) {
      
      return error.message;

    }

  }
}
