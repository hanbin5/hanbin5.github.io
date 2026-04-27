---
title: Markov Decision Process
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
## Rewards
With MDP search trees, the agent faces **reward sequences**.

Agent will
1. Maximize the sum of rewards
2. Prefer rewards **now** over rewards later
### Discounting
Since agent prefers rewards now over rewards later, we design discounting factor $\gamma$.
Values of rewards **decay exponentially by discount factor** $\gamma$.
Each time we descend a tree level, we multiply in the discount once.

The reason why discounts.
- Mathematically convenient (it helps our algorithm converge)
- Avoid infinite returns in some cases
- Follow animal/human behavior (e.g., immediate financial rewards earn more interest)
### Infinite Reward Problem
What if the game lasts forever?

$$
U([1,1,1,\dots]) = U([9,9,9,\dots]) = \infty 
$$

**Solution**
1. Finite horizon (similar to depth-limit search)
	- Terminate episodes after a fixed step of $H$ (= horizon)
2. Discounting
	- Use $0 < \gamma < 1$

$$
	U([r_0,\dots,r_\infty]) = \sum_{t=0}^\infty \gamma^t r_t \le \frac{R_{max}}{1-\gamma}
$$

## Value Functions
The value of a **state $s$**: $V$-value
> $V^*(s) =$ expected utility starting in $s$ and acting optimality

The value of a $q$-state $(s, a)$: $Q$-value
> $Q^*(s, a) =$ expected utility starting out having taken action $a$ from state $s$ and (thereafter) acting optimally.

The optimal **policy**
> $\pi^*(s) =$ optimal action from state $s$

Then, how we compute $V^*(s)$?
1. Utility

$$
R(s, a, s') + V^*(s')
$$

2. Expected utility starting in $s$

$$
\sum_{s'} T(s, a, s') \left[R(s, a, s') + V^*(s')\right]
$$

3. Expected utility starting in $s$ and acting optimality

$$
V^*(s) = \max_a \sum_{s'} T(s, a, s') \left[R(s, a, s') + V^*(s')\right]
$$

4. Put discounting factor

$$
V^*(s) = \max_a \sum_{s'} T(s, a, s') \left[R(s, a, s') + \gamma V^*(s')\right] 
$$

## Value Iteration

> [!note] **Value Iteration algorithm** with finite horizon $H$
> Start with $V_0(s)=0$ for all $s$
> For $k = 1, \dots, H$:
> For all states $s$ in $S$:
>
> $$
> V_k(s) \leftarrow \max_a \sum_{s'} P(s'|s, a) (R(s, a, s') + \gamma V_{k-1}(s'))
> $$
>
- Example
![Pasted image 20260427143540](/attachments/Pasted%20image%2020260427143540.png)
- $k=0$
	- $V_0(c) = 0$
	- $V_0(w) = 0$
	- $V_0(o) = 0$
- $k=1$

$$
\begin{alignedat}{2}
	V_1(c) &= \max_{a \in \{s, f\}}\Big(&&T(c,s,c)[R(c,s,c)+V_0(c)]+T(c,s,w)[R(c,s,w) + V_0(c)], \\ &&&T(c,f,c)[R(c,f,c)+V_0(c)]+T(c,f,w)[R(c,f,w)+V_0(c)]\Big) \\ &= \max_{a \in \{s, f\}} \Big( &&1.0(1 + 0) + 0, 0.5(2 + 0) + 0.5(2 + 0) \Big) \\ &= 2
	\end{alignedat}
$$

$$
\begin{alignedat}{2}
	V_1(w) &= \max_{a \in \{s, f\}}\Big(&&T(w,s,c)[R(w,s,c)+V_0(w)]+T(w,s,w)[R(w,s,w) + V_0(w)], \\ &&&T(w,f,c)[R(w,f,c)+V_0(w)]+T(w,f,w)[R(w,f,w)+V_0(w)] \\ &&&+ T(w, f, o)[R(w, f, o) + V_0(w)]\Big) \\ &= \max_{a \in \{s, f\}} \Big( &&0.5(1 + 0) + 0.5(1 + 0), 0 + 1.0(-10 + 0) \Big) \\ &= 1
	\end{alignedat}
$$

For converge, we modify definition of value iteration.
> [!note] (Modified) **Value Iteration algorithm** with finite horizon $H$
> Start with $V_0(s)=0$ for all $s$
> For $k = 1, \dots,$ until $V_k$ converges
> For all states $s$ in $S$:
>
> $$
> V_k(s) \leftarrow \max_a \sum_{s'} P(s'|s, a) (R(s, a, s') + \gamma V_{k-1}(s'))
> $$
>
> [!abstract] Theorem
> Value Iteration **converges**. At convergence, we can find the **optimal value function $V^*$**

With the converged $V^*(s)$, the agent can decide **how to act**:

$$
\pi^*(s) = \arg \max_a \sum_{s'} P(s'|s, a) [R(s, a, s') + \gamma V^*(s')]
$$

*Time Complexity*: $O(|A||S|^2)$

- Problem of Value Iteration
	1. It's slow with the complexity of $O(|A||S|^2)$ per iteration
	2. Values converge after long iteration. But the policy converges way earlier.

## Policy Iteration
So, we think evaluating fixed policy $\pi$, and improve it.
- Bellman (Optimality) Equation

$$
V^*(s) = \max_a \sum_{s'} P(s'|s, a)(R(s, a, s') + \gamma V^*(s')) 
$$

- Bellman (Expectation) Equation

$$
V^{\pi}(s) = \sum_{s'} P(s'|s, \pi(s))(R(s, \pi(s), s') + \gamma V^\pi(s'))
$$

Then, how can we calculate $V^\pi(s)$ for a fixed policy?
1. Use iteration updates
2. Solve linear system.

> [!note] Policy Iteration Algorithm
> Start with arbitrary policy $\pi_0$ & $V_0$
> For $k=0, 1, \dots,$ until $\pi_k$ converges:
> 1. **Policy Evaluation**
> For $i = 0, 1, \dots,$ until $V_i^{\pi_k}$ converges:
>
> $$
> V_{i + 1}^{\pi_k}(s)\leftarrow \sum_{s'} P(s'|s, \pi_k(s)) (R(s, \pi_k(s), s') + \gamma V_i^{\pi_k}(s')) 
> $$
>
> 2. **Policy Improvement**
>
> $$
> \pi_{k+1}(s)\leftarrow \arg \max_a \sum_{s'} P(s'|s, a)(R(s, a, s') + \gamma V^{\pi_k}(s'))
> $$
>
