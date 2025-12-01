ABS_SYSTEM_PROMPT = "You are a critic assessing a tutor who is interacting with a student by providing a clear, objective single evaluation score on specific criteria, ensuring each assessment reflects the absolute standards set for performance."

ABSOLUTE_PROMPT = """### Task Description:
You are a critic assessing a tutor who is interacting with a student. The assessment of the ###Tutor_Response should be based on the following: ###Conversation_Topic, ###Previous_Conversation_between_Tutor_and_Student, ###Definitions_of_criteria,
###Score_Rubric, and ###Correct_Reference_Tutor Response.
1. Write a detailed feedback that assess the quality of the ###Tutor_Current_Response strictly based on the given score rubric, not evaluating in general.
2. After writing a feedback, write a score that is an integer 1, 2 or 3. You should refer to the score rubric.
3. The output format should look as follows: "(write a feedback for criteria) [RESULT] (an integer 1, 2, or 3)"
4. Please do not generate any other opening, closing, or explanations.

###Conversation_Topic: {topic}

###Previous_Conversation_between_Tutor_and_Student: {previous_conversation}

###Definitions_of_criteria: {definition}

###Score_Rubric: {rubric}

###Correct_Reference_Tutor_Response: {reference_answer}

###Tutor_Current_Response: {response}

###Feedback: """

ABSOLUTE_PROMPT_WO_REF = """### Task Description:
You are a critic assessing a tutor who is interacting with a student. The assessment of the ###Tutor_Response should be based on the following: ###Conversation_Topic, ###Previous_Conversation_between_Tutor_and_Student, ###Definitions_of_criteria, and
###Score_Rubric.
1. Write a detailed feedback that assess the quality of the ###Tutor_Current_Response strictly based on the given score rubric, not evaluating in general.
2. After writing a feedback, write a score that is an integer 1, 2 or 3. You should refer to the score rubric.
3. The output format should look as follows: "(write a feedback for criteria) [RESULT] (an integer 1, 2, or 3)"
4. Please do not generate any other opening, closing, or explanations.

###Conversation_Topic: {topic}

###Previous_Conversation_between_Tutor_and_Student: {previous_conversation}

###Definitions_of_criteria: {definition}

###Score_Rubric: {rubric}

###Tutor_Current_Response: {response}

###Feedback: """

################################
REL_SYSTEM_PROMPT = "You are a critic assessing a tutor who is interacting with a student to deliver insightful feedback that compares individual performances, highlighting how each stands relative to others within the same cohort."

RELATIVE_PROMPT = """### You are a critic assessing a tutor who is interacting with a student. The assessment of the ###Tutor_Response should be based on the following: ###Conversation_Topic, ###Previous_Conversation_between_Tutor_and_Student, ###Definitions_of_criteria,
###Score_Rubric, and ###Correct_Reference_Tutor Response.
1. Write detailed feedback that assesses the quality of two responses strictly based on the given score rubric, not evaluating in general.
2. After writing feedback, choose the better response between Response A and Response B. You should refer to the score rubric.
3. The output format should look as follows: "(write feedback for criteria) [RESULT] (A or B)"
4. Please do not generate any other opening, closing, or explanations.

###Conversation_Topic: {topic}

###Previous_Conversation_between_Tutor_and_Student: {previous_conversation}

###Response_A: {response_A}

###Response_B: {response_B}

###Definitions_of_criteria: {definition}

###Score_Rubric: {rubric}

###Correct_Reference_Tutor_Response: {reference_answer}

###Feedback: """

RELATIVE_PROMPT_WO_REF = """### You are a critic assessing a tutor who is interacting with a student. The assessment of the ###Tutor_Response should be based on the following: ###Conversation_Topic, ###Previous_Conversation_between_Tutor_and_Student, ###Definitions_of_criteria, and
###Score_Rubric
1. Write detailed feedback that assesses the quality of two responses strictly based on the given score rubric, not evaluating in general.
2. After writing feedback, choose the better response between Response A and Response B. You should refer to the score rubric.
3. The output format should look as follows: "(write feedback for criteria) [RESULT] (A or B)"
4. Please do not generate any other opening, closing, or explanations.

###Conversation_Topic: {topic}

###Previous_Conversation_between_Tutor_and_Student: {previous_conversation}

###Response_A: {response_A}

###Response_B: {response_B}

###Definitions_of_criteria: {definition}

###Score_Rubric: {rubric}

###Feedback: """

################################
# Definitions for each conversation dimension
DEFINITIONS = {
    "Mistake_Identification": "Has the tutor identified or recognized a mistake in a student’s response?",
    "Mistake_Location": "Does the tutor’s response accurately pinpoint the location of a genuine mistake?",
    "Providing_Guidance": "Does the tutor offer correct and relevant guidance, such as an explanation, elaboration, hint, examples, and so on?",
    "Actionability": "Is it clear from the tutor’s feedback what the student should do next?",
}

################################
# Rubrics for each conversation dimension
MISTAKE_IDENTIFICATION_RUBRIC = """
[Has the tutor identified a mistake in the student’s response?]
Score 1: The tutor failed to identify any mistake.
Score 2: TThe tutor partially recognized the mistake but did not fully capture it.
Score 3: The tutor correctly identified the mistake in the student’s response.
""".strip()

MISTAKE_LOCATION_RUBRIC = """
[Does the tutor’s response accurately point to a genuine mistake and its location?]
Score 1: The tutor fails to indicate the mistake or its location.
Score 2: The tutor points to a mistake but imprecisely or partially.
Score 3: The tutor accurately points to the exact mistake and its location.
""".strip()

PROVIDING_GUIDANCE_RUBRIC = """
[Does the tutor offer correct and relevant guidance, such as an explanation, elaboration, hint, examples, and so on?]
Score 1: The tutor fails to provide relevant guidance.
Score 2: The guidance is partially correct or not fully helpful.
Score 3: The tutor provides correct and relevant guidance, hints, examples, or explanation. 
""".strip()

ACTIONABILITY_RUBRIC = """
[Is it clear from the tutor’s feedback what the student should do next?]
Score 1: The feedback does not indicate any actionable steps.
Score 2: The next steps are somewhat unclear or incomplete.
Score 3: It is clear what the student should do next.
""".strip()