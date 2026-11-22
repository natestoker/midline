# DRAFT: blog post, 7 December (scoring and pass marks)

Status: rewrite of the earlier draft, not published. Screenshot notes and
links carried over unchanged.

---

## An 80% pass mark on a 9-question quiz means one wrong answer

Most pass marks get typed into a box at the end of a project. 80% sounds
reasonable, so 80% it is.

But a percentage hides what you're really deciding, which is how many
questions a learner is allowed to miss. On my Arcade quiz template that
number is one. Nine scored questions, 80% to pass: 8 right passes, 7 right
fails.

That might be exactly what you want. It might also be far stricter than you
meant. Either way you should know it before the quiz goes to the LMS.

### Count misses, not percent

Before you accept any pass mark, work out the count for your own quiz.

| Scored questions | 80% means | Misses allowed |
| --- | --- | --- |
| 5 | 4 right | 1 |
| 9 | 8 right | 1 |
| 10 | 8 right | 2 |
| 20 | 16 right | 4 |

Then ask the real question: what should a pass mean? If it means "this person
can do the task safely," a casual refresher and a compliance sign-off should
not share a number. If the pass mark comes from policy, use the policy's
number and say so on the intro slide.

Whatever you choose, tell the learner. In the template, the pass mark lives in
the Results slide settings, and the intro slide states it in plain text. Change
one and you have to change the other.

[Screenshot: The quiz result properties window with the pass mark field highlighted. Alt text: "Storyline 360 result slide properties with the passing score setting highlighted."]

### The question I left out of the score

[Arcade Quiz Template](https://natestoker.com/store/arcade-quiz-template?utm_source=blog&utm_medium=build-note&utm_campaign=dec07-scoring-pass-marks)
has ten questions, and only nine count. The tenth asks "How sure are you
about that?"

It has no right answer, so it earns no points. What it gives you is a second
reading on the learner. Someone who got a question wrong and was certain they
were right needs different help from someone who guessed. The template saves
the answer in a variable, so you can show it on the Results slide, branch on
it, or send it to your reporting.

[Screenshot: The Confidence Rating slide with the answer options visible. Alt text: "Confidence Rating question in the Arcade template, an unscored question that stores the learner's answer in a variable."]

### Two things to test before you ship

**Retries.** Fail the quiz on purpose in Preview, press Try Again, and watch
the score. Decide whether a second attempt replaces the first, and check your
LMS agrees.

**Pick Many questions.** Select some of the right answers but not all, and
see what score you get. Do this before you decide how much the question is
worth.

[Screenshot: The Results slide in the fail state with the banner, score, Review and Try Again buttons visible. Alt text: "Arcade Results slide showing a fail banner, the learner's score and the Review and Try Again buttons."]

### What the template ships with

- 12 slides: an intro, ten questions and a Results slide.
- Nine questions at 10 points each, 90 in total, pass mark 80%.
- One unscored confidence question, saved to a variable.
- Correct and incorrect feedback on every question, plus Review and Try Again
  on the Results slide.
- Every question works from the keyboard alone.

All of those numbers are defaults you can change. It needs Storyline 360 on
the desktop.

[Get the Arcade Quiz Template](https://natestoker.com/store/arcade-quiz-template?utm_source=blog&utm_medium=build-note&utm_campaign=dec07-scoring-pass-marks)
