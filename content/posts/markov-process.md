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

> Then, did expectimax compute a policy?

Answer is yes, it can do. If you run expectimaxs at every state, you get an action for each state. But, this is inefficient since
1. Expectimax doesn't exploit the Markov assumption - it treats the same state on different paths as different nodes. This causes redundant computation.
2. Expectimax returns only the best action at the root state — one query, one answer. Value Iteration computes $V(s)$ for all states at once, so we can extract a policy $\pi(s)$ for every state from a single run.
3. MDPs often have no terminal state and contain cycles, so the expectimax tree never bottoms out. Value Iteration handles this naturally by iterating $V(s)$ on a finite state table until convergence.
## MDP Search Trees
![Pasted image 20260427112217](/attachments/Pasted%20image%2020260427112217.png)

