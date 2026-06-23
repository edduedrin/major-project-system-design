export interface CreateQuestionPayload {
    questionText: string;
    answerType: 'radio' | 'checkbox';
    options: string[];
    createdBy: number | undefined;
}

export interface AnswerPayload {
    questionId: number;
    optionIds: number[];
}

export interface SubmitSurveyPayload {
    userId: number;
    answers: AnswerPayload[];
}
