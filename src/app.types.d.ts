import * as z from 'zod';

const codeExecutionSchema = z.object({

    language : z.enum(['python', 'javascript', 'typescript']),
    code : z.string(),
    testcases : z.object({
      input: z.number() || z.string() || z.array(z.string()) || z.array(z.number()),
      output: z.number() || z.string() || z.array(z.string()) || z.array(z.number()),
    }),
  });