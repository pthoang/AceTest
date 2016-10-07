var
    answer = helper.answer,
    question = helper.question;

var mcSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['question', 'corrects', 'wrongs', 'type'],
    properties: {
        question: question,
        corrects: {
            type: 'array',
            minItems: 1,
            items: answer
        },
        explanation: question,
        wrongs: {
            type: 'array',
            minItems: 1,
            items: answer
        },
        collaborators: {
            type: 'array',
            items: {
                minLength: 1,
                type: 'string'
            }
        },
        type: {
            constant: 'mc'
        }
    }
};