---
title: "Reading notes: Diffusion Policy (Chi et al., 2023)"
date: 2026-04-24
categories:
  - paper-notes
tags:
  - diffusion
  - imitation-learning
  - robotics
excerpt: "Why modeling the action *distribution* (instead of the mean) is the whole ballgame on multimodal demonstrations."
---

*This is a template post — replace with your actual notes, or delete and
 start fresh.*

## The problem in one sentence

**Behavioral cloning collapses on multimodal demonstrations** — if demonstrators take different-but-valid paths to the same goal, a policy trained to predict the mean action ends up *between* the valid actions, which is often invalid.

## The fix in one sentence

**Model the action distribution directly with a diffusion model**, so multiple valid actions can be sampled at test time.

## Key design choices

- **Action sequences, not single actions.** Predict a short horizon (e.g. 16 steps) at once. Single-step prediction loses temporal coherence.
- **Observation history as condition.** Feed the last few observations as the conditioning signal — this is what lets the policy distinguish between different multimodal paths.
- **UNet-based noise predictor.** The denoising network takes the noisy action sequence + observation embedding, predicts the noise.
- **Receding-horizon control.** At test time, predict `H` actions, execute the first `n` (`n < H`), then re-plan. `n` is a knob that trades reactivity vs. smoothness.

## What surprised me

- How much the **action-horizon knob `n`** matters at inference time. Small `n` = jittery; large `n` = sluggish recovery from disturbances. The paper's plots show this, but you don't feel it until you turn the knob yourself.
- **DDIM sampling with 10 steps** was enough for real-time control — didn't need full 100-step DDPM sampling. Compute scales with #steps, so this matters.

## What I didn't get on the first pass

*(edit with your real questions when you read the paper)*

- Why the visual encoder is trained end-to-end here rather than using a frozen pretrained one — haven't worked out the trade-off.
- Haven't seen an ablation that isolates "action-sequence prediction" from "diffusion objective" cleanly — which is the bigger contribution?

## Links

- Paper: *Diffusion Policy: Visuomotor Policy Learning via Action Diffusion*, Chi et al., 2023. [[arXiv](https://arxiv.org/abs/2303.04137)]
- Official code: [GitHub](https://github.com/real-stanford/diffusion_policy)
- My reproduction (WIP): [GitHub](https://github.com/hanbin5/diffusion-policy-repro) *(replace with real)*
