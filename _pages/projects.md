---
title: "Projects"
permalink: /projects/
layout: single
author_profile: true
toc: true
---

A running list of reproductions, side projects, and tooling I've built along the way. Longer write-ups live as [blog posts](/posts/); this page is the index.

---

## Diffusion Policy Reproduction

From-scratch reproduction of **Diffusion Policy** (Chi et al., 2023) on the Push-T benchmark, aimed at understanding *why* diffusion-based action generation outperforms classical BC on multimodal demonstrations.

- Implemented the UNet-based noise predictor over short action sequences, conditioned on a history of observations.
- Benchmarked against a vanilla BC baseline and an LSTM policy.

[[GitHub]](https://github.com/hanbin5/diffusion-policy-repro) · [[Write-up]](/posts/2026/04/24/diffusion-policy-notes/)

---

## Manipulation Demo Collection Pipeline

ROS-based pipeline for recording and time-aligning teleoperated manipulation demos, and exporting to a format compatible with common imitation-learning codebases.

- 6-DoF teleop via SpaceMouse / VR controller.
- Multi-sensor time-sync + post-processing to HDF5 / Parquet.

[[GitHub]](https://github.com/hanbin5/teleop-pipeline) *(replace with real link)*

---

*Replace / delete these entries with your own — the template syntax is simple
 enough that adding a project is just copy-paste-edit.*
