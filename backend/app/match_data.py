import random
from typing import Dict, Any, List

class MatchSimulator:
    def __init__(self):
        # Team Rosters
        self.mi_players = {
            "Rohit Sharma": {"role": "Batsman", "runs": 45, "balls": 28, "fours": 5, "sixes": 2, "out": True},
            "Ishan Kishan": {"role": "Wicketkeeper-Batsman", "runs": 22, "balls": 15, "fours": 3, "sixes": 0, "out": True},
            "Suryakumar Yadav": {"role": "Batsman", "runs": 20, "balls": 12, "fours": 2, "sixes": 1, "out": True},
            "Hardik Pandya": {"role": "All-rounder", "runs": 15, "balls": 10, "fours": 1, "sixes": 1, "out": False},
            "Tilak Varma": {"role": "Batsman", "runs": 28, "balls": 18, "fours": 2, "sixes": 1, "out": False},
            "Tim David": {"role": "Batsman", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": False},
            "Romario Shepherd": {"role": "All-rounder", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": False},
            "Gerald Coetzee": {"role": "Bowler", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": False},
            "Jasprit Bumrah": {"role": "Bowler", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": False},
            "Piyush Chawla": {"role": "Bowler", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": False},
            "Akash Madhwal": {"role": "Bowler", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": False}
        }
        
        self.rr_players = {
            "Trent Boult": {"role": "Bowler", "overs": 3.0, "runs": 24, "wickets": 1, "maidens": 0},
            "Ravichandran Ashwin": {"role": "Bowler", "overs": 3.0, "runs": 28, "wickets": 1, "maidens": 0},
            "Yuzvendra Chahal": {"role": "Bowler", "overs": 3.0, "runs": 30, "wickets": 1, "maidens": 0},
            "Sandeep Sharma": {"role": "Bowler", "overs": 2.0, "runs": 18, "wickets": 0, "maidens": 0},
            "Avesh Khan": {"role": "Bowler", "overs": 2.0, "runs": 20, "wickets": 0, "maidens": 0}
        }
        
        # Reset current state
        self.reset_match()

    def reset_match(self):
        self.batting_team = "MI"
        self.bowling_team = "RR"
        self.target = 185
        self.runs = 135
        self.wickets = 3
        self.balls_bowled = 90  # 15.0 overs completed (15 * 6)
        
        # Current batting pair
        self.striker = "Hardik Pandya"
        self.non_striker = "Tilak Varma"
        self.dismissed_players = ["Rohit Sharma", "Ishan Kishan", "Suryakumar Yadav"]
        self.remaining_batting_order = ["Tim David", "Romario Shepherd", "Gerald Coetzee", "Jasprit Bumrah", "Piyush Chawla", "Akash Madhwal"]
        
        # Partnership info
        self.partnership_runs = 43
        self.partnership_balls = 28
        
        # Bowler Schedule
        self.bowler_schedule = {
            16: "Ravichandran Ashwin",
            17: "Trent Boult",
            18: "Yuzvendra Chahal",
            19: "Sandeep Sharma",
            20: "Avesh Khan"
        }
        
        self.current_bowler = self.bowler_schedule[16]
        self.recent_sequence = []
        self.over_summary = []
        self.is_over_completed = False
        self.match_over = False
        self.match_result = ""

    def get_current_over_num(self) -> int:
        return (self.balls_bowled // 6) + 1

    def get_formatted_overs(self) -> float:
        completed = self.balls_bowled // 6
        fraction = self.balls_bowled % 6
        return float(f"{completed}.{fraction}")

    def simulate_next_ball(self) -> Dict[str, Any]:
        if self.match_over:
            return {"error": "Match has already concluded."}

        over_idx = self.get_current_over_num()
        self.current_bowler = self.bowler_schedule.get(over_idx, "Avesh Khan")
        
        # Outcome weights based on player skills
        # Striker and bowler affect weights
        outcomes = ["dot", "single", "double", "four", "six", "wicket", "wide", "no-ball"]
        
        # Adjust weights dynamically based on batter form and bowler type
        is_striker_pandya = self.striker == "Hardik Pandya"
        is_bowler_spinner = self.current_bowler in ["Ravichandran Ashwin", "Yuzvendra Chahal"]
        
        if is_striker_pandya and is_bowler_spinner:
            # Pandya aggressive against spin
            weights = [0.20, 0.35, 0.08, 0.12, 0.15, 0.05, 0.04, 0.01]
        elif self.current_bowler == "Trent Boult":
            # Boult is dangerous, higher dot ball/wicket probability
            weights = [0.35, 0.35, 0.05, 0.10, 0.05, 0.06, 0.03, 0.01]
        else:
            # Default death over weights
            weights = [0.25, 0.40, 0.07, 0.12, 0.07, 0.05, 0.03, 0.01]

        outcome = random.choices(outcomes, weights=weights, k=1)[0]
        
        runs_scored = 0
        is_wicket = False
        is_extra = False
        extra_type = None
        wicket_type = None
        dismissed_name = None
        desc = ""
        
        # Detailed commentary phrases based on outcome, bowler, and striker
        bowler_first = self.current_bowler.split()[-1]
        striker_first = self.striker.split()[0]
        
        if outcome == "dot":
            runs_scored = 0
            desc = random.choice([
                f"{bowler_first} fires it in, {striker_first} swings and misses completely! Dot ball.",
                f"Excellent delivery from {bowler_first}, beaten for pace. Defensive stroke from {striker_first}.",
                f"Slower delivery outside off, {striker_first} guides it straight to short third man. No run."
            ])
        elif outcome == "single":
            runs_scored = 1
            desc = random.choice([
                f"{bowler_first} bowls short, {striker_first} tucks it to deep midwicket for a single.",
                f"Guided away down to third man by {striker_first} for a comfortable run.",
                f"Soft hands from {striker_first}, tapping it towards cover and they scurry through for a single."
            ])
        elif outcome == "double":
            runs_scored = 2
            desc = random.choice([
                f"Superb placement! {striker_first} flicks this wide of deep square leg and they hustle back for a second.",
                f"Slashed away through point, excellent running between the wickets gets them two runs.",
                f"High into the air but drops in no man's land in the deep! They manage a quick double."
            ])
        elif outcome == "four":
            runs_scored = 4
            desc = random.choice([
                f"Shot! {striker_first} cracks this through the covers, no chance for the sweeper. Boundary!",
                f"Sublime! {striker_first} stands tall and punches it past mid-off for a glorious four.",
                f"Edged and runs away! {striker_first} gets a bit of luck as it flies past slip to the boundary."
            ])
        elif outcome == "six":
            runs_scored = 6
            desc = random.choice([
                f"MASSIVE! {striker_first} unleashes the slog sweep and deposits {bowler_first} way back into the Wankhede crowd!",
                f"That is astronomical! {striker_first} loads the hips and lofts this high and far over long-on for six!",
                f"Beautifully struck! A clean lofted drive from {striker_first} clears the straight boundary with ease."
            ])
        elif outcome == "wicket":
            is_wicket = True
            dismissed_name = self.striker
            wicket_type = random.choice(["Caught in the deep", "Clean bowled", "L.B.W.", "Run out"])
            
            if wicket_type == "Clean bowled":
                desc = f"BOWLED HIM! {bowler_first} breaks through the defense. The stumps are rattled! {dismissed_name} departs."
            elif wicket_type == "L.B.W.":
                desc = f"OUT! Huge shout for LBW, and the umpire's finger goes up! {bowler_first} traps {dismissed_name} plumb in front."
            elif wicket_type == "Caught in the deep":
                fielder = random.choice(["Samson", "Buttler", "Jaiswal", "Jurel", "Hetmyer"])
                desc = f"CAUGHT! {striker_first} tries to clear the boundary, but doesn't get the distance. {fielder} takes a clean catch at deep midwicket!"
            else: # Run out
                desc = f"RUN OUT! A direct hit from the deep and {dismissed_name} is caught short of the crease while attempting a desperate second!"

        elif outcome == "wide":
            runs_scored = 1
            is_extra = True
            extra_type = "wide"
            desc = f"Wide ball! {bowler_first} sprays this one well down the leg side. Umpire signals wide."
        elif outcome == "no-ball":
            runs_scored = 1
            is_extra = True
            extra_type = "no-ball"
            desc = f"No ball! {bowler_first} has overstepped the crease. Free hit coming up!"

        # Process statistics
        if not is_extra:
            self.balls_bowled += 1
            self.partnership_balls += 1
            # Update batsman stats
            self.mi_players[self.striker]["balls"] += 1
            if outcome == "single":
                self.mi_players[self.striker]["runs"] += 1
                self.runs += 1
                self.partnership_runs += 1
                # Rotate strike
                self.striker, self.non_striker = self.non_striker, self.striker
            elif outcome == "double":
                self.mi_players[self.striker]["runs"] += 2
                self.runs += 2
                self.partnership_runs += 2
            elif outcome == "four":
                self.mi_players[self.striker]["runs"] += 4
                self.mi_players[self.striker]["fours"] += 1
                self.runs += 4
                self.partnership_runs += 4
            elif outcome == "six":
                self.mi_players[self.striker]["runs"] += 6
                self.mi_players[self.striker]["sixes"] += 1
                self.runs += 6
                self.partnership_runs += 6
            elif outcome == "wicket":
                self.wickets += 1
                self.mi_players[self.striker]["out"] = True
                self.dismissed_players.append(self.striker)
                
                # Check if all out
                if self.wickets >= 10:
                    self.match_over = True
                    self.match_result = f"Rajasthan Royals won by {self.target - self.runs - 1} runs!"
                else:
                    # New batsman comes in
                    new_batsman = self.remaining_batting_order.pop(0)
                    self.striker = new_batsman
                    self.partnership_runs = 0
                    self.partnership_balls = 0
            
            # Update bowler stats
            self.rr_players[self.current_bowler]["overs"] = float(f"{self.balls_bowled // 6}.{self.balls_bowled % 6}")
            if outcome in ["single", "double", "four", "six"]:
                self.rr_players[self.current_bowler]["runs"] += runs_scored
            if is_wicket:
                self.rr_players[self.current_bowler]["wickets"] += 1
        else:
            # Wide or No-ball adds 1 run to score but doesn't increase balls_bowled
            self.runs += 1
            self.partnership_runs += 1
            self.rr_players[self.current_bowler]["runs"] += 1

        # Check if MI has chased down target
        if self.runs >= self.target:
            self.match_over = True
            self.match_result = f"Mumbai Indians won by {10 - self.wickets} wickets!"
        
        # Check if match completed (all 20 overs finished)
        if self.balls_bowled >= 120 and not self.match_over:
            self.match_over = True
            if self.runs == self.target - 1:
                self.match_result = "Match Tied! Super Over!"
            else:
                self.match_result = f"Rajasthan Royals won by {self.target - self.runs - 1} runs!"

        # Over completed check
        self.is_over_completed = (self.balls_bowled % 6 == 0) and not is_extra and not self.match_over
        
        # Add to ball-by-ball record
        ball_info = f"{(self.balls_bowled - 1) // 6}.{(self.balls_bowled - 1) % 6 + 1}"
        if is_extra:
            ball_info = f"{(self.balls_bowled) // 6}.{self.balls_bowled % 6} (Extra)"
            
        ball_record = f"{ball_info}: {self.current_bowler} to {self.striker if outcome == 'single' else self.non_striker if outcome == 'wicket' else self.striker}, {runs_scored} run(s) ({outcome})"
        if is_wicket:
            ball_record = f"{ball_info}: {self.current_bowler} to {dismissed_name}, OUT ({wicket_type})"
            
        self.recent_sequence.append(ball_record)
        if len(self.recent_sequence) > 6:
            self.recent_sequence.pop(0)

        # Build current ball package
        ball_package = {
            "over_num": (self.balls_bowled - 1) // 6 if not is_extra else self.balls_bowled // 6,
            "ball_num": (self.balls_bowled - 1) % 6 + 1 if not is_extra else self.balls_bowled % 6,
            "batsman": {
                "name": self.striker,
                "runs": self.mi_players[self.striker]["runs"],
                "balls": self.mi_players[self.striker]["balls"],
                "fours": self.mi_players[self.striker]["fours"],
                "sixes": self.mi_players[self.striker]["sixes"],
                "strike_rate": round((self.mi_players[self.striker]["runs"] / max(1, self.mi_players[self.striker]["balls"])) * 100, 1)
            },
            "bowler": {
                "name": self.current_bowler,
                "overs": self.rr_players[self.current_bowler]["overs"],
                "runs_conceded": self.rr_players[self.current_bowler]["runs"],
                "wickets": self.rr_players[self.current_bowler]["wickets"],
                "economy": round((self.rr_players[self.current_bowler]["runs"] / max(0.1, self.rr_players[self.current_bowler]["overs"])) , 2)
            },
            "outcome": {
                "runs": runs_scored,
                "is_wicket": is_wicket,
                "wicket_type": wicket_type,
                "dismissed_player": dismissed_name,
                "is_extra": is_extra,
                "extra_type": extra_type,
                "description": desc
            }
        }
        
        # If over completed, swap strike
        if self.is_over_completed:
            self.striker, self.non_striker = self.non_striker, self.striker

        return ball_package

    def get_full_state(self) -> Dict[str, Any]:
        remaining_balls = max(0, 120 - self.balls_bowled)
        runs_needed = max(0, self.target - self.runs)
        
        # Current run rates
        current_rr = round((self.runs / max(0.1, self.balls_bowled / 6)), 2)
        required_rr = round((runs_needed / max(0.1, remaining_balls / 6)), 2) if remaining_balls > 0 else 0.0

        return {
            "match_state": {
                "batting_team": self.batting_team,
                "bowling_team": self.bowling_team,
                "runs": self.runs,
                "wickets": self.wickets,
                "overs": self.get_formatted_overs(),
                "target": self.target,
                "runs_needed": runs_needed,
                "balls_remaining": remaining_balls,
                "required_run_rate": required_rr,
                "current_run_rate": current_rr,
                "match_over": self.match_over,
                "match_result": self.match_result,
                "is_over_completed": self.is_over_completed
            },
            "partnership": {
                "batsmen": [self.striker, self.non_striker],
                "runs": self.partnership_runs,
                "balls": self.partnership_balls
            },
            "player_stats": {
                "MI": self.mi_players,
                "RR": self.rr_players
            },
            "recent_sequence": self.recent_sequence
        }
