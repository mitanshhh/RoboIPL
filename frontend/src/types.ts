export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  out: boolean;
  role?: string;
}

export interface Bowler {
  name: string;
  overs: number;
  runs: number;
  runs_conceded?: number;
  wickets: number;
  economy: number;
  maidens?: number;
}

export interface MatchState {
  batting_team: string;
  bowling_team: string;
  runs: number;
  wickets: number;
  overs: number;
  target: number;
  runs_needed: number;
  balls_remaining: number;
  required_run_rate: number;
  current_run_rate: number;
  match_over: boolean;
  match_result: string;
  is_over_completed: boolean;
}

export interface Partnership {
  batsmen: string[];
  runs: number;
  balls: number;
}

export interface BallOutcome {
  runs: number;
  is_wicket: boolean;
  wicket_type: string | null;
  dismissed_player: string | null;
  is_extra: boolean;
  extra_type: string | null;
  description: string;
}

export interface CurrentBall {
  over_num: number;
  ball_num: number;
  batsman: {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strike_rate: number;
  };
  bowler: {
    name: string;
    overs: number;
    runs_conceded: number;
    wickets: number;
    economy: number;
  };
  outcome: BallOutcome;
}

export interface CommentaryEntry {
  over: number;
  agent: 'MI Agent' | 'RR Agent' | 'RAG Expert';
  text: string;
  audio_url: string | null;
  use_browser_tts: boolean;
  text_to_speak: string;
  gender: 'male' | 'female';
}

export interface FullState {
  match_state: MatchState;
  partnership: Partnership;
  player_stats: {
    MI: Record<string, Batsman>;
    RR: Record<string, Bowler>;
  };
  recent_sequence: string[];
  key_insights: string[];
  commentary_history: CommentaryEntry[];
}
