---
title: Markov Process
dex:
date: 2026-04-26
tags:
  - artificial-intelligence
type: Note
publish: true
---
# Markov
## Intuition
If you takes some action, how many information needed for you until you act.
There are so many information.
Computer is weak that stored its informations.
Just model action very simple conditional probability s.t.

$$
p(A | S) \qquad\text{action A if you are state S.}
$$

And you put all information in $S$ having finite space.
## Definition
> [!note] Markov
> A state $s_t$ is **Markov** if and only if
>
> $$
> P(s_{t+1}|s_t) = P(s_{t+1}|s_t, s_{t-1}, \dots, s_1) 
> $$
>
It means that $s_t$ contains all informations of $s_t, \dots, s_1$.

- Example
  Given a state transition graph $a \to b \to c$, we can state that $p(c|b) = p(c|b, a)$.
# Markov Decision Processes
Our goal is an **optimal policy** $\pi^*: S \to A$. 
It means a policy $\pi$ gives an action for each state, i.e., $\pi(s) = a$.



