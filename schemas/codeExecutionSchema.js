
const { z } = require('zod');

const ALLOWED_LANGUAGES = ['javascript'];

const checkLanguage = (language) => {
    return ALLOWED_LANGUAGES.includes(language);
}

const codeExecutionSchema = z.object({

    language: z.string().refine(checkLanguage),
    code: z.string(),
    problemId: z.number(),
    submissionId: z.number()

});

module.exports = {
    codeExecutionSchema
}