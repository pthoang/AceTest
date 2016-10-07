var
    question = helper.question;

var tfSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['question', 'correct', 'type'],
    properties: {
        question: question,
        correct: {
            type: 'object',
            additionalProperties: false,
            required: ['answer'],
            properties: {
                answer: {
                    type: 'boolean'
                }
            }
        },
        type: {
            constant: 'tf'
        },
        explanation: question,
        collaborators: {
            type: 'array',
            items: {
                minLength: 1,
                type: 'string'
            }
        }
    }
};