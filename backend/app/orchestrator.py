import os
import json
import logging
import random
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from app.config import config

logger = logging.getLogger("orchestrator")

# Configure Gemini
if config.GEMINI_API_KEY:
    genai.configure(api_key=config.GEMINI_API_KEY)
    GEMINI_AVAILABLE = True
    logger.info("Gemini API initialized successfully.")
else:
    GEMINI_AVAILABLE = False
    logger.warning("GEMINI_API_KEY not found. Operating in simulation-commentary fallback mode.")

class AgentOrchestrator:
    def __init__(self):
        # Local commentary templates in case Gemini is not available
        self.mock_mi_comments = [
            "What an absolute beauty of a shot! Hardik Pandya sends it flying to the boundary! The Wankhede is rockin'! What's your take on that, RR Agent?",
            "Tilak Varma takes a quick single to rotate the strike. Really smart, sensible batting under pressure.",
            "Oh man, Ashwin is bowling a super tight spell here. But MI needs to keep finding those runs. Let's see what happens on the next ball.",
            "The Wankhede crowd is going absolutely wild! Mumbai Indians need to start accelerating right now. Let's go!",
            "Oh no! Pandya is out! That is a massive blow for MI. All the pressure is on Tim David now."
        ]
        
        self.mock_rr_comments = [
            "Absolute masterclass in line and length from Chahal! The field placements are spot-on; they are not giving away easy runs.",
            "Trent Boult's swing is just lethal in these opening overs. Another dot ball! The Royals are putting the squeeze on.",
            "You've got to appreciate Sanju Samson's captaincy. Bringing Sandeep back at this crucial stage is pure genius.",
            "That was a good six, but Avesh made a stellar comeback on the very next delivery. If we keep our cool, this match is ours!",
            "Out! Hetmyer pulls off an unbelievable catch at the boundary! The game plan worked to perfection!"
        ]
        
        self.mock_rag_comments = [
            "If we look at the numbers, Hardik Pandya strikes at a massive 165.4 against spin in the death overs. Chahal needs to tread carefully.",
            "Here is a quick rule check: on a free-hit delivery, the batsman can only be dismissed via run out, obstructing the field, or hitting the ball twice.",
            "Wankhede Stadium has relatively short boundaries of around 72 meters, meaning even mistimed shots can clear the rope.",
            "Looking at the matchup stats, Trent Boult has dismissed Tilak Varma twice in their last four encounters.",
            "According to the pitch report, the ball is holding in the surface slightly, making Sandeep's slower cutters incredibly effective."
        ]

    def _get_agent_prompt(self, agent_name: str, shared_context: Dict[str, Any], current_ball: Dict[str, Any]) -> str:
        """Constructs a context-rich prompt for the given agent."""
        match_state = shared_context.get("match_state", {})
        recent_seq = "\n".join(shared_context.get("recent_sequence", []))
        comm_history = ""
        for c in shared_context.get("commentary_history", []):
            comm_history += f"{c['agent']}: {c['text']}\n"

        prompt = f"""
You are the official "{agent_name}" in a live 3-Agent IPL commentary panel.
The teams playing are Mumbai Indians (MI) vs Rajasthan Royals (RR) at the Wankhede Stadium.
MI is chasing {match_state.get('target')} and the score is currently {match_state.get('runs')}/{match_state.get('wickets')} in {match_state.get('overs')} overs.

MATCH STATE DETAILS:
- Striker: {current_ball['batsman']['name']} ({current_ball['batsman']['runs']} runs, {current_ball['batsman']['balls']} balls)
- Bowler: {current_ball['bowler']['name']} ({current_ball['bowler']['overs']} overs, {current_ball['bowler']['wickets']} wickets)
- Most Recent Ball Outcome: {current_ball['outcome']['description']}
- Runs scored on last ball: {current_ball['outcome']['runs']} (Is Wicket: {current_ball['outcome']['is_wicket']}, Is Extra: {current_ball['outcome']['is_extra']})

RECENT DELIVERIES:
{recent_seq}

CONVERSATION HISTORY OF CURRENT OVER:
{comm_history}

"""
        if agent_name == "MI Agent":
            prompt += """
YOUR ROLE (MI Agent):
- You represent the Mumbai Indians perspective. You are a super passionate, energetic, and dramatic MI supporter, commenting in a lively, conversational English style.
- Use exciting, emotional English expressions (e.g., "What a sensational hit!", "The Wankhede is absolutely electric!", "Unbelievable scenes!", "Pure class!").
- Speak in a lively, conversational, non-formal, and entertaining tone.
- Speak slowly and clearly.
- Deliver exactly 1 to 2 short sentences of English commentary.
- Proactively hand over to "RR Agent" for a comeback (e.g., "What do you say to that, RR Agent?").
- DO NOT use bullet points or markdown bold/stars. Respond as plain text.
"""
        elif agent_name == "RR Agent":
            prompt += """
YOUR ROLE (RR Agent):
- You represent the Rajasthan Royals perspective. You are calm, measured, analytical, but highly conversational and speak in elegant, strategic English.
- Counter the MI Agent's excitement with RR's tactical intelligence (e.g., "Not so fast, MI Agent! Our bowlers have executed this plan to perfection.", "Chahal's spin wizardry is just too good for anyone to handle!").
- Deliver exactly 1 to 2 short sentences of English commentary.
- If the current ball had a complex rule or technical matchup, suggest "RAG Expert" for clarification (e.g., "RAG Expert, give us the breakdown on this matchup!"). Otherwise, pass back to "MI Agent" for the next delivery.
- Speak slowly, naturally, and avoid overly formal language.
- DO NOT use bullet points or markdown. Respond as plain text.
"""
        elif agent_name == "RAG Expert":
            prompt += """
YOUR ROLE (RAG Expert):
- You are a neutral, extremely knowledgeable Cricket Statistician and Rule Expert. You explain complex cricket details in a friendly, engaging, conversational English style.
- Give a brief historical, statistical, or rule-based insight related to the play (e.g., "Historically, Wankhede is a high-scoring ground...", "The head-to-head stats show a clear advantage...").
- Deliver exactly 1 to 2 short sentences. Make it sound fascinating and engaging, not like a boring lecture!
- Speak slowly and clearly.
- DO NOT use bullet points or markdown. Respond as plain text.
"""
        return prompt

    def generate_commentary_turn(self, agent_name: str, shared_context: Dict[str, Any], current_ball: Dict[str, Any]) -> str:
        """Calls Gemini API to generate the commentary, or uses the mock fallback if key is missing."""
        if not GEMINI_AVAILABLE:
            if agent_name == "MI Agent":
                return random.choice(self.mock_mi_comments)
            elif agent_name == "RR Agent":
                return random.choice(self.mock_rr_comments)
            else:
                return random.choice(self.mock_rag_comments)

        try:
            prompt = self._get_agent_prompt(agent_name, shared_context, current_ball)
            
            # Use gemini-3.5-flash for fast and cost-effective commentary
            model = genai.GenerativeModel("gemini-3.1-flash-lite")
            
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=150
                )
            )
            
            commentary = response.text.strip()
            # Clean formatting symbols (e.g. quotes or stars)
            commentary = commentary.replace('"', '').replace('*', '')
            return commentary
            
        except Exception as e:
            logger.error(f"Gemini generation failed for {agent_name}: {str(e)}")
            # Graceful fallback to mock commentary
            if agent_name == "MI Agent":
                return random.choice(self.mock_mi_comments)
            elif agent_name == "RR Agent":
                return random.choice(self.mock_rr_comments)
            else:
                return random.choice(self.mock_rag_comments)

    def should_trigger_rag(self, current_ball: Dict[str, Any], mi_comment: str, rr_comment: str) -> bool:
        """Determines if the RAG Expert should participate in this ball's commentary."""
        outcome = current_ball["outcome"]
        
        # Trigger triggers: Wicket, No-ball/Free Hit, Six, or heavy tactical terms in comments
        if outcome["is_wicket"] or outcome["is_extra"] or outcome["runs"] == 6:
            return True
            
        # Text based triggers
        triggers = ["slog", "sweep", "yorker", "googly", "carrom", "lbw", "drs", "matchup", "spin", "cutter"]
        text_pool = (mi_comment + " " + rr_comment).lower()
        if any(term in text_pool for term in triggers):
            return True
            
        # 30% random chance to keep the panel interesting even on standard balls
        return random.random() < 0.3

    def compress_context_over(self, shared_context: Dict[str, Any]) -> List[str]:
        """
        Compresses the shared context when an over completes.
        Generates 2 new 'key_insights' summarizing the over, and flushes historical details.
        """
        if not GEMINI_AVAILABLE:
            # Python-based mock compression fallback
            runs = shared_context["match_state"]["runs"]
            wkt = shared_context["match_state"]["wickets"]
            over = shared_context["match_state"]["overs"]
            return [
                f"Completed over {int(over)}: MI score stands at {runs}/{wkt}.",
                "Bowler focused on squeezing the wide crease channel; batting side is rotating strike."
            ]

        try:
            recent_seq = "\n".join(shared_context.get("recent_sequence", []))
            prompt = f"""
You are an expert cricket analyst. Review this sequence of balls from the completed over:
{recent_seq}

Extract exactly 2 concise, highly strategic tactical insights about this over's play (e.g. bowler speed variations, batsman struggles, boundary areas targeted).
Return the result strictly as a JSON list of strings.
Example:
["Ashwin's carrom ball is restricting Varma's sweep shot.", "MI batsmen are content with singles to build the partnership."]
"""
            model = genai.GenerativeModel("gemini-3.1-flash-lite")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.4
                )
            )
            
            insights = json.loads(response.text.strip())
            if isinstance(insights, list) and len(insights) > 0:
                return insights[:2]
            return ["Excellent tactical over completed.", "Strategic matchups are key going forward."]
            
        except Exception as e:
            logger.error(f"Failed to compress context over: {str(e)}")
            return ["Completed over shows intense death-overs strategic pressure.", "Both teams are vying for tactical control."]

orchestrator = AgentOrchestrator()
