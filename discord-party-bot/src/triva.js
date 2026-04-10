import axios from "axios";

export async function fetchTrivia() {
  const res = await axios.get(
    "https://opentdb.com/api.php?amount=1&type=multiple"
  );

  const q = res.data.results[0];

  return {
    question: q.question,
    answer: q.correct_answer,
  };
}