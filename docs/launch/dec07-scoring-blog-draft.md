# DRAFT: blog post, 7 December (scoring and pass marks)

Status: third version, not published. Screenshot notes and links carried over
unchanged.

---

## How scoring works in the Arcade quiz template

Arcade is a quiz template I made for Storyline 360. It has an intro slide, ten
question slides and a Results slide, styled like an old arcade game.

People who buy it usually ask the same two things: how is the score worked
out, and how do I change the pass mark? This post answers both. It also
covers two things I'd check before you publish.

[Screenshot: Storyline slide view of the Arcade deck with all 12 slides in the left panel. Alt text: "Storyline 360 slide list showing the intro, ten question slides and the Results slide of the Arcade quiz template."]

### How the score is worked out

Nine of the ten questions are scored. Each is worth 10 points, so the quiz is
out of 90.

The pass mark is 80%. With nine questions, that means a learner needs 8 right
to pass. If they get 7 right, they fail.

The Results slide shows the score, the pass mark and a pass or fail banner.

### The one question that isn't scored

The tenth question is called Confidence Rating. It asks the learner how sure
they are about their answers.

There's no right answer to that, so it has no points. The template saves the
learner's choice in a variable instead. You can ignore it, show it on the
Results slide, or use it in a trigger. For example, you could show extra
feedback to someone who was very confident and still failed.

[Screenshot: The Confidence Rating slide with the answer options visible. Alt text: "Confidence Rating question in the Arcade template, an unscored question that stores the learner's answer in a variable."]

### How to change the pass mark

1. Go to the Results slide.
2. Open its quiz result properties.
3. Change the passing score.
4. Go to the intro slide and change the pass mark in the text there, so it
   matches.

Step 4 is easy to forget. The intro slide is plain text, so it won't update
by itself.

[Screenshot: The quiz result properties window with the pass mark field highlighted. Alt text: "Storyline 360 result slide properties with the passing score setting highlighted."]

Before you pick a number, work out how many questions it lets a learner miss.
With nine scored questions:

| Pass mark | Right answers needed | Misses allowed |
| --- | --- | --- |
| 100% | 9 | 0 |
| 80% | 8 | 1 |
| 70% | 7 | 2 |
| 60% | 6 | 3 |

80% sounds generous, but on this quiz it allows only one mistake. If you add
or remove questions, redo the count.

### How to change the points

Each question's points are set in that question's own properties. I left them
all at 10 so every question counts the same.

If you change them, the total changes too. The Results slide has a line that
says "Points (of 90)", and that 90 is typed in by hand. Update it if your
total is different.

### Two things to check in Preview

**Try Again.** Fail the quiz on purpose, press Try Again and answer again.
Make sure the score you end up with is the one you expect.

**Pick Many.** On the Pick Many question, choose some of the right answers
but not all of them. See whether Storyline marks that right or wrong. That
tells you whether you're happy with what the question is worth.

[Screenshot: The Results slide in the fail state with the banner, score, Review and Try Again buttons visible. Alt text: "Arcade Results slide showing a fail banner, the learner's score and the Review and Try Again buttons."]

### Where to get it

The template needs Storyline 360 on the desktop. Every question works with
the keyboard as well as the mouse.

[Arcade Quiz Template](https://natestoker.com/store/arcade-quiz-template?utm_source=blog&utm_medium=build-note&utm_campaign=dec07-scoring-pass-marks)
