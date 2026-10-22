# Plain-Language System Guide & Formula Definitions

## Matching Research Study
**"A Nonstationary Semi-Markov Rainfall Synthesis and Stochastic Water-Balance Reliability Framework for Optimizing School Rainwater Harvesting Systems"**

---

## 1. What Is This Research Study About? (Quick Overview)

Scientific research titles often sound intimidating. Here is what every part of that title means in plain, everyday English:

| Scientific Research Term | Everyday Meaning | Why It Matters for a School |
| :--- | :--- | :--- |
| **"Nonstationary"** | The weather changes with the seasons; it does not stay the same throughout the year. | A school in Panay experiences very wet monsoon months (June to November) and very dry summer months (January to April). The computer model must treat each month differently, not use a flat average. |
| **"Semi-Markov"** | Rainy days and dry days come in clusters (spells). If today is raining, tomorrow is more likely to rain. If a dry spell starts, it can last for weeks. | Standard math assumes every day is a random coin flip. In real life, weather has "memory." Multi-week dry spells are what actually cause school water tanks to run dry. |
| **"Rainfall Synthesis"** | Using real historical weather records (from PAGASA) to generate realistic, simulated daily rainfall sequences for 10 to 30 years into the future. | We only have past weather records. By learning the patterns from the past, the computer can test how a school tank would survive across hundreds of possible future rainy and dry years. |
| **"Stochastic Water-Balance"** | A day-by-day bookkeeping of water entering and leaving the tank, repeated across many randomized ("stochastic") future weather scenarios. | Just like checking a bank account: daily deposits (rain from the roof) minus daily withdrawals (handwashing and toilet flushing) equals water left in the tank. |
| **"Reliability Framework"** | Measuring what percentage of school days the tank successfully provides water without running empty. | If a tank meets demand on 85 out of 100 school days, it has **85% reliability**. On the other 15 days, the school needs a backup water source. |
| **"Optimizing School Rainwater Harvesting Systems"** | Finding the "sweet spot" tank size that is neither too small (runs dry constantly) nor too big (expensive, wasteful, and sits half-empty). | Helps school principals and PTA engineers choose the right tank capacity and shows how to connect standard commercial tanks in parallel. |

---

## 2. In-Depth Concept Definitions: Advantages and Disadvantages

This section provides a thorough explanation of each core scientific term in the research study title, contrasting it with traditional methods, highlighting its key advantages, and outlining its real-world limitations.

---

### 2.1 Nonstationary Process (Stationary vs. Nonstationary)

#### What Is It?
In statistics, a **stationary** system assumes that the rules of the weather (such as the average rainfall, variance, and probability of rain) stay identical all year round. 

A **nonstationary** system recognizes that weather parameters change over time. In our rainfall model, nonstationarity means the computer applies **twelve separate, independent mathematical profiles—one for each calendar month**:
- August has a ~75% chance of consecutive rainy days and heavy precipitation.
- February has only a ~12% chance of rain and long stretches of zero precipitation.

#### Real-World Analogy:
Think of budgeting household electricity. A *stationary* budget gives you the exact same electricity allowance in scorching April as in cool December. A *nonstationary* budget recognizes that your air conditioning and fan usage surge during hot summer months and drops during the cool rainy season.

#### Advantages:
1. **Captures Real Tropical Seasonality:** Accurately mirrors the pronounced wet season (Habagat / Southwest Monsoon) and dry season (Amihan) of the Philippines.
2. **Prevents Underestimating Drought Risk:** Traditional stationary models spread rainfall evenly across 365 days, which artificially hides the dangerous 3-to-4-month summer drought. Nonstationary modeling exposes exactly when tanks will run dry.
3. **Realistic Monthly Peak Inflows:** Captures the months when school gutters will experience heavy overflow, helping engineers size gutters and first-flush systems properly.

#### Disadvantages & Limitations:
1. **Requires More Historical Data:** You cannot calibrate a nonstationary model with only 1 or 2 years of data; you need at least 15 to 30 years of daily records so every individual month has enough historical wet and dry days to be statistically accurate.
2. **Computational Overhead:** The computer must calibrate and store 12 sets of transition probabilities and distribution parameters instead of just one overall average.

---

### 2.2 Semi-Markov Process (Standard Markov vs. Semi-Markov)

#### What Is It?
A standard **Markov Chain** is "memoryless." It decides whether tomorrow will rain based *only* on whether it rained today. This creates an unrealistic mathematical flaw: wet spells and dry spells are forced to follow a steep geometric decline, meaning 1-day or 2-day spells are heavily favored, while long 14-day droughts or 5-day typhoons become mathematically rare.

A **Semi-Markov Process** fixes this. Instead of flipping a coin every single morning, when the weather enters a dry or wet period, it samples the **entire duration of that spell** from a realistic probability distribution (specifically, an overdispersed Negative Binomial or Gamma-Poisson distribution).

#### Real-World Analogy:
- **Standard Markov Chain:** Like a person who wakes up every morning, forgets what happened earlier in the week, and flips a coin to decide whether to go jogging.
- **Semi-Markov Process:** Like a person checking a weather forecast, realizing a tropical depression or a heatwave has arrived, and deciding: *"This weather pattern will settle in for the next 5 days."*

#### Advantages:
1. **Accurate Drought Persistence:** Correctly simulates unbroken multi-week dry spells. In rainwater harvesting, what empties a tank is not the total rain in a year, but the **length of continuous unbroken dry days**.
2. **Realistic Storm Clustered Downpours:** Simulates consecutive monsoon downpours where a tank fills completely on Day 1 and spills excess water on Days 2, 3, and 4.
3. **Eliminates "Chatter":** Standard Markov models suffer from unrealistically high "weather chatter" (jumping back and forth: dry-wet-dry-wet). Semi-Markov maintains realistic weather persistence.

#### Disadvantages & Limitations:
1. **Mathematical Complexity:** Requires computing both the mean and the variance of spell durations and applying Gamma-Poisson mixtures when variance exceeds the mean.
2. **Data Sensitivity:** If historical station records have missing data gaps or unrecorded days, spell lengths can be distorted.

---

### 2.3 Rainfall Synthesis (Synthetic Weather Generation)

#### What Is It?
**Rainfall Synthesis** is the computational generation of artificial, long-term daily rainfall data that has never occurred in the exact historical order, but is statistically indistinguishable from the real climate.

The computer analyzes 20 to 36 years of PAGASA station records, learns the underlying statistical rules (spell durations, transition chances, rainfall intensity distribution), and then generates 10, 20, or 50 "synthetic" future years.

#### Real-World Analogy:
Think of an artificial intelligence trained on thousands of photos of mango trees. It can generate brand-new, photorealistic pictures of mango trees that never existed in real life, yet every branch, leaf shape, and fruit matches the botanical laws of a real mango tree.

#### Advantages:
1. **Tests the "What-Ifs":** Historical weather only happened one way. Synthesis allows us to test hundreds of alternative, plausible weather realities that the school might face over the next 25 years.
2. **Overcomes Limited Records:** If a school only has 10 years of historical PAGASA data, synthesis can generate 100 years of synthetic daily weather to evaluate rare 1-in-20-year severe droughts.
3. **Seamless Daily Resolution:** Provides day-by-day numbers needed for tank storage calculations, which are not available in coarse monthly climate summaries.

#### Disadvantages & Limitations:
1. **Not a Weather Forecast:** It does not predict whether it will rain on November 15 next year. It generates statistically plausible climate behavior for planning, not short-term weather forecasts.
2. **Garbage In, Garbage Out:** If the historical PAGASA records used for calibration contain errors, gaps, or were measured at a station far away from the school, the synthetic weather will inherit those errors.

---

### 2.4 Stochastic Modeling (Deterministic vs. Stochastic)

#### What Is It?
- **Deterministic Approach:** Uses fixed, single numbers. For example: *"Average annual rain = 2,000 mm. Roof = 600 m². Inflow = 1,020,000 Liters. Daily use = 1,000 L. Therefore, a 15,000 L tank is fine."* It gives one single answer and assumes every year behaves like clockwork.
- **Stochastic Approach:** Incorporates randomness, probability, and uncertainty. It runs the simulation across **an ensemble of 24 different randomized weather runs**, recognizing that one year might bring 2,600 mm of rain while another brings only 1,300 mm with an extended El Niño drought.

#### Real-World Analogy:
- **Deterministic:** Planning your school commute by saying: *"The trip takes exactly 22 minutes every single day."*
- **Stochastic:** Planning your commute by saying: *"On typical days it takes 22 minutes, on clear days it takes 15 minutes, but during heavy traffic or rain it takes 45 minutes. I should plan accordingly."*

#### Advantages:
1. **Reveals Uncertainty Ranges:** Instead of a misleading single number, it provides a realistic range: **Cautious (10th percentile / drought year)**, **Typical (median normal year)**, and **Best Case (wet year)**.
2. **Risk-Aware Decision Making:** School administrators can see the risk: *"In an average year, our tank gives 84% coverage. But during a severe drought year, coverage drops to 80%."*
3. **Prevents Costly Under-Design:** Prevents building a system that works fine during a wet year but completely fails during the first dry year.

#### Disadvantages & Limitations:
1. **More Complex for Stakeholders:** Non-technical school heads or PTA members may find ranges harder to interpret than a single definitive number.
2. **Computationally Demanding:** The computer must simulate tens of thousands of daily water-balance steps across multiple runs rather than executing a single arithmetic formula.

---

### 2.5 Water-Balance Reliability (Daily Mass Balance)

#### What Is It?
**Water-Balance Reliability** is the exact percentage of school days during the simulation where the rainwater tank contains enough water to satisfy 100% of the students' daily hygiene and sanitation needs.

It is computed through a daily accounting simulation called **Yield-After-Spill (YAS)**:
$$\text{Water in Tank Today} = \min(\text{Tank Size}, \; \text{Water Yesterday} + \text{Today's Rain Inflow}) - \text{Today's Usage}$$

If the remaining water covers the full day's demand, the day is marked as **Met (Covered)**. If the tank runs dry, the day is marked as a **Shortage (Deficit)**.

#### Real-World Analogy:
Think of your mobile data plan. If your 30-day plan provides enough internet on 27 days, but runs out of data on the last 3 days of the month, your plan's reliability is:
$$\frac{27}{30} \times 100\% = 90\%$$

#### Advantages:
1. **Directly Relevant to School Operations:** A school principal does not need to understand cubic meters of runoff; they need to know: *"How many days will our students have water in the comfort rooms?"*
2. **Accounts for Spills and Overflows:** A huge 100 mm typhoon downpour cannot be saved in a small 5,000 L tank; the excess spills out. Water balance accounts for these real-world physical limits.
3. **Burn-In Cycle Accuracy:** Pre-runs a 1-year cycle before recording statistics so the initial condition (whether the tank started empty or half-full) does not bias the final score.

#### Disadvantages & Limitations:
1. **Assumes Constant Daily Usage:** In real schools, water use varies slightly (e.g., higher on sports days, zero on weekends/holidays).
2. **Quantity Only (Not Water Quality):** Measures whether water is physically in the tank, not whether the water has bacteria, algae, or sediment. Filtration and chlorination must be handled separately.

---

### 2.6 Optimization Framework (The Knee of the Curve / Pareto Optimum)

#### What Is It?
**Optimization** is the engineering method used to select the best possible tank size from available commercial options. It balances two competing forces:
- **Higher Reliability** (wants the tank to be as large as possible).
- **Lower Construction Cost & Practicality** (wants the tank to be as small and affordable as possible).

The system finds the **"Knee of the Curve"** (the Pareto optimum)—the exact point where adding another 1,000 Liters of tank capacity ceases to provide meaningful gains in reliability.

#### Real-World Analogy:
Think of buying smartphone storage. Moving from 32 GB to 128 GB is a massive improvement (your phone stops freezing and holds all your apps). But paying double to jump from 512 GB to 1 Terabyte provides almost no noticeable benefit for everyday use because most of that extra storage will sit empty. The 128 GB or 256 GB model is the "knee of the curve."

#### Advantages:
1. **Protects School Budgets:** Prevents school principals or PTAs from wasting limited MOOE or donation funds on mammoth 50,000 L tanks that will sit half-empty 8 months of the year.
2. **Provides Actionable Tiers:** Generates three practical choices:
   - **Budget Choice:** Affordable starter tank for schools with immediate funding limits (~70–75% coverage).
   - **Recommended Size:** The cost-effective sweet spot (~80–85% coverage).
   - **Extra Reserve:** High-capacity setup for schools with zero backup water sources (~90%+ coverage).
3. **Solves the Market Availability Problem:** When the recommended size is large (e.g., 18.6 kL or 26.5 kL), the system breaks it down into standard commercial vertical tanks (e.g., $2 \times 10\text{ kL}$ in parallel) that can actually be bought in local hardware supply stores.

#### Disadvantages & Limitations:
1. **Does Not Eliminate the Need for Backup Water:** An optimized rainwater harvesting system is a supplemental conservation system. In severe multi-month tropical summer droughts, even the best rainwater tank will eventually run out, requiring a backup deep well or municipal tap connection.

---

## 3. Why Did We Build This System? (The Problem with Simple Averages)

### The "Average Rainfall" Trap
Imagine someone tells you: *"Your school gets an average of 2,000 mm of rain per year. That is more than enough water for all your students!"*

This sounds reassuring, but it hides a dangerous trap:
- **80% of that rain falls during the monsoon season** (July to October), causing the tank to overflow and waste water.
- **For 3 to 4 months in summer** (January to April), almost zero rain falls.
- If you build a small tank based on the annual average, **the tank runs completely dry by mid-February**, leaving students with no water for handwashing or comfort rooms for the rest of the school year.

### How Our System Solves This
Instead of using a simple average, this application simulates **every single day for 10 to 30 school years**. It tracks downpours, dry spells, daily student usage, overflows, and shortages to tell the school exactly how many days their tank will last.

---

## 4. The Core Formulas Explained in Plain English

The platform uses four simple calculation steps:

```
       [ 1. Weather Generator ]
                 ↓  (Daily Rainfall in mm)
       [ 2. Roof Catchment Inflow ]
                 ↓  (Liters Collected Daily)
       [ 3. Daily Water Bookkeeping (Water Balance) ]
          ↑
  [ 4. Student Daily Usage (Demand) ]
```

---

### Formula 1: Daily Water Usage (Campus Demand)

Before sizing a tank, we must know: **How much water does the campus need each day?**

Instead of guessing, the platform calculates usage from actual school facilities:

$$\text{Daily Water Usage} = \text{Handwashing Usage} + \text{Comfort Room Usage}$$

$$\text{Handwashing Usage} = (\text{Handwashing Stations}) \times (\text{Faucets per Station}) \times (\text{Liters per Faucet per Day})$$

$$\text{Comfort Room Usage} = (\text{Restrooms}) \times (\text{Toilet Cubicles per Restroom}) \times (\text{Liters per Toilet per Day})$$

#### Standard School Example:
* **Handwashing:** 4 group wash areas $\times$ 5 faucets each $\times$ 25 Liters/faucet/day = **500 Liters/day**
* **Comfort Rooms:** 4 restrooms $\times$ 2 toilets each $\times$ 62.5 Liters/toilet/day = **500 Liters/day**
* **Total Daily Campus Usage:** $500 + 500 =$ **1,000 Liters/day**

#### Where Did These Numbers Come From?
- **DepEd WinS Policy (Order No. 10 s.2016):** Mandates daily supervised group handwashing with soap before meals and after restroom use, plus clean, functional comfort rooms.
- **WHO / UNICEF Global WASH Standards:** Recommends **1.5 to 5.0 Liters per student per day** for basic day-school hygiene.
- For a school of 450 students and teachers:
  $$\frac{1,000\text{ Liters}}{450\text{ people}} \approx 2.22\text{ Liters per person per day}$$
  This fits comfortably within the international recommended standard.

---

### Formula 2: Harvested Rainwater (Roof Inflow)

When rain falls on a school rooftop, how many liters actually reach the storage tank?

$$\text{Water Entering Tank (Liters)} = (\text{Clean Rain Depth}) \times (\text{Roof Area}) \times (\text{Runoff Factor}) \times (\text{Gutter Efficiency})$$

#### What Each Piece Means:
1. **Clean Rain Depth:**
   $$\text{Clean Rain} = \text{Rainfall Today} - \text{First Flush Loss}$$
   The first **0.5 to 1.0 mm** of rain washes dust, bird droppings, and leaves off the roof. The "first-flush diverter" throws this dirty water away so it does not contaminate the storage tank.
2. **Roof Area:**
   The total flat footprint of the classroom buildings in square meters ($\text{m}^2$).
   - A standard DepEd classroom has a roof area of approximately **63 square meters**.
   - A 10-classroom school has $10 \times 63 = \mathbf{630\text{ m}^2}$ of roof area.
3. **Runoff Factor (0.85):**
   Smooth corrugated galvanized iron (G.I.) sheets catch most rain, but about 15% is lost to evaporation, surface wetting, and wind spray.
4. **Gutter Efficiency (0.90):**
   About 10% of water is lost due to gutter overflow during violent downpours, leaves on the mesh screen, or splashing.

#### Example Calculation:
If a steady afternoon shower drops **10 mm** of rain on a 630 $\text{m}^2$ roof:
- Clean Rain = $10\text{ mm} - 0.5\text{ mm (first flush)} = \mathbf{9.5\text{ mm}}$
- Water Collected = $9.5 \times 630 \times 0.85 \times 0.90 = \mathbf{4,578\text{ Liters}}$
A single 10 mm rainfall event provides enough water to run the school's facilities for more than 4 full school days.

---

### Formula 3: Daily Tank Storage (The Water Bookkeeping)

Every single day of the simulation, the computer runs a basic bookkeeping balance (called the **Yield-After-Spill** model):

$$\text{Water in Tank Today} = \text{Water Yesterday} + \text{Today's Rain Inflow} - \text{Today's School Usage}$$

#### Two Rules Apply:
1. **The Tank Cannot Hold More than Its Maximum Size:**
   If the tank holds 10,000 Liters, has 8,000 Liters inside, and 5,000 Liters of rain enters today:
   The tank fills to 10,000 Liters, and the remaining 3,000 Liters harmlessly overflows into the school drainage (Overflow / Spill).
2. **If the Tank Runs Out of Water:**
   If the tank only has 300 Liters left, but the school needs 1,000 Liters today:
   The students use the 300 Liters, the tank hits 0 (empty), and the school suffers a **shortage of 700 Liters** on that day.

---

### Formula 4: Reliability (% Days Covered)

Reliability is the central scorecard of the rainwater harvesting system:

$$\text{Reliability (\%)} = \left( \frac{\text{Number of School Days with Full Water}}{\text{Total Number of Simulated School Days}} \right) \times 100\%$$

#### How to Read the Three Numbers:
Because weather changes from year to year, the system tests **24 possible weather realities** and presents three key figures:

| Term | What It Represents | How the School Should Use It |
| :--- | :--- | :--- |
| **Cautious (10th Percentile)** | **Severe Drought Year:** The worst 1 out of 10 years, where summer dry spells are exceptionally long and harsh. | Use this for safety. If your cautious reliability is 80%, you know that even during an El Niño drought, your school will still have water on 80 out of 100 days. |
| **Typical (50th Percentile / Median)** | **Normal Everyday Year:** What you will experience in an ordinary, average school year. | Use this for budgeting and general PTA planning. |
| **Best Case (90th Percentile)** | **Very Wet Year:** An exceptionally rainy year with frequent tropical storms and monsoon refills. | Shows how well the system performs when rain is abundant. |

---

## 5. How the System Selects the "Recommended" Tank Size

A common misconception is: *"If a 10 kL tank gives 79% reliability, then a 50 kL tank must be twice as good!"*

This is incorrect due to the principle of **Diminishing Returns** (the **"Knee of the Curve"**):

```
Reliability
  100% |                                      .......... (Flat Ceiling: ~92%)
       |                                 ..'''
   84% |                        ..-''' <--- KNEE OF THE CURVE (Optimal Recommendation)
       |                   ..-''
   73% |              ..-'' <--- BUDGET CHOICE (Starter Tank)
       |         ..-''
   38% |      .-' (Small 1 kL Tank)
    0% +-----------------------------------------------------------------------
       0      5 kL     10 kL     18.6 kL     26.5 kL     35 kL ... 50 kL
                                 Tank Capacity
```

### The Three Tiers Explained:

1. **Budget Choice (Low-Cost Starter Option):**
   - **Target:** Reaches around **70% to 75% typical reliability**.
   - **Who It Is For:** Schools with limited initial funds who want a working system immediately. It covers normal rainy and moderate months, with the understanding that auxiliary water (well or municipal tap) will be needed in dry summer.
2. **Recommended Size (The Pareto "Sweet Spot"):**
   - **Target:** Reaches the **knee of the curve** (typically **80% to 85% typical reliability** or **80% cautious reliability**).
   - **Why This Size?**
     - Moving from 1 kL to 18.6 kL boosts reliability by **+46%** (from 38% to 84%).
     - But moving from 18.6 kL to 26.5 kL (spending money on 8,000 Liters more tank capacity) only adds **+2.2%** more water coverage.
     - Why? Because during the long dry season, it stops raining completely. An oversized tank will simply sit half-empty because there is no rain to fill it. 18.6 kL is the most economical investment.
3. **Extra Reserve (High Resilience Option):**
   - **Target:** Reaches **90% or higher typical reliability**.
   - **Who It Is For:** Schools with zero backup water sources or high-priority health clinics where running dry even once is unacceptable.

---

## 6. Why Recommend "Multiple Tanks in Parallel" Instead of One Huge Tank?

When the simulation recommends a large capacity (e.g., **18.6 kL** or **26.5 kL**), users often ask:
> *"Where can we buy a 26,500-Liter vertical plastic tank?"*

The answer is: **You cannot buy one off the shelf in the Philippines.**

Standard commercial polyethylene and stainless tanks (brands like Bestank, Firstank, and Weida) typically max out at **10,000 Liters (10 kL)**. Anything larger requires expensive on-site custom reinforced concrete construction.

### The Modular Parallel Solution:
Civil and sanitary engineers install **modular batteries of standard tanks**:
- **Instead of 1 impossible 26.5 kL tank:** Install **$2 \times 10\text{ kL} + 1 \times 6\text{ kL}$ tanks in parallel** (Total: 26.0 kL), or **$3 \times 10\text{ kL}$ tanks** (Total: 30.0 kL).
- **Instead of 1 impossible 18.6 kL tank:** Install **$2 \times 10\text{ kL}$ tanks in parallel** (Total: 20.0 kL), or **$1 \times 10\text{ kL} + 1 \times 8\text{ kL} + 1 \times 1\text{ kL}$**.

### How Parallel Tanks Work Mechanically:
1. All tanks sit side-by-side on the same flat concrete slab.
2. A 2-inch pipe connects the bottom outlets of all tanks (an **equalizing manifold**).
3. Under basic physics (hydrostatic pressure), water levels in all tanks rise and fall together automatically.
4. If one tank needs cleaning or repairs, a simple ball valve allows that single tank to be shut off while the remaining tanks continue supplying water to the students.

---

## 7. Summary of Terms for Presentations & Research Defense

When presenting this system to school administrators, DepEd officials, or research panels, use this handy translation guide:

| If a panelist asks about... | Explain it simply like this... |
| :--- | :--- |
| **"What makes your model nonstationary?"** | "We apply twelve separate monthly climate profiles rather than a flat yearly average, allowing the model to capture the extreme contrast between wet monsoon months and dry summer droughts." |
| **"Why is a Semi-Markov model better than a standard Markov chain?"** | "Standard Markov chains assume every day is almost memoryless and fail to capture multi-week droughts. A Semi-Markov model explicitly samples the full length of dry spells, which is what actually causes school tanks to run dry." |
| **"What is synthetic rainfall generation?"** | "It is using statistical rules learned from 20 to 36 years of historical PAGASA data to generate realistic future weather years, allowing us to stress-test the school's tank across hundreds of plausible weather scenarios." |
| **"Why use a stochastic model instead of a deterministic one?"** | "A deterministic model assumes every year has the exact same rainfall. A stochastic model incorporates natural weather randomness and provides a risk range: Cautious (worst drought year), Typical (normal year), and Best Case." |
| **"Where did you get your water usage numbers?"** | "Our usage is grounded in DepEd WinS Order 10 s.2016 and WHO school hygiene guidelines: 25 Liters per faucet daily for group handwashing and 62.5 Liters per toilet daily for comfort room sanitation, which equals about 2.2 Liters per person per day." |
| **"What does 85% reliability mean?"** | "Out of 100 school days, students have full water from the rainwater tank on 85 days. On the remaining 15 days, auxiliary tap or well water is needed." |
| **"Why not build a 50 kL or 100 kL tank?"** | "Because of diminishing returns (the knee of the curve). Extra tank volume sits empty during the summer dry season because there is no rain to fill it. Spending more money yields almost no additional water days." |
| **"How will the school physically install this?"** | "Using standard commercial 10,000-Liter tanks connected in parallel with equalizing pipes at the base. This is cheaper, easier to transport, and allows phased installation as budget becomes available." |
