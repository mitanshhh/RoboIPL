import asyncio
import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "OneDrive", "Desktop", "Projects", "Python Artificial Intelligence", "Project", "Agentic Premiere League", "backend")))

from main import process_ball_and_broadcast, simulator

async def main():
    print("=" * 70)
    print("TESTING MULTI-AGENT IPL COMMENTARY SIMULATION")
    print("=" * 70)
    
    # 1. Reset
    print("\n[RESETTING MATCH STATE TO 15.0 OVERS]")
    simulator.reset_match()
    initial = simulator.get_full_state()
    print(f"Match: {initial['match_state']['batting_team']} vs {initial['match_state']['bowling_team']}")
    print(f"Score: {initial['match_state']['runs']}/{initial['match_state']['wickets']} (Target: {initial['match_state']['target']})")
    print(f"Batters at crease: {initial['partnership']['batsmen'][0]} & {initial['partnership']['batsmen'][1]}")
    
    # 2. Simulate 3 balls
    for i in range(1, 4):
        print(f"\n{'-'*30} SIMULATING BALL #{i} {'-'*30}")
        # Run process ball
        res = await process_ball_and_broadcast()
        
        # Display Outcome
        ball = res['current_ball']
        outcome = ball['outcome']
        print(f"Over {ball['over_num']}.{ball['ball_num']} | Bowler: {ball['bowler']['name']} -> Batter: {ball['batsman']['name']}")
        print(f"Outcome: {outcome['description']} ({outcome['runs']} runs, Wicket: {outcome['is_wicket']})")
        print(f"New Score: {res['match_state']['runs']}/{res['match_state']['wickets']} (Overs: {res['match_state']['overs']})")
        
        # Display Commentary turns
        print("\nMulti-Agent Studio Debates:")
        for comm in res['commentary']:
            print(f"  [{comm['agent']}]: {comm['text']}")
            print(f"    - Voice URL: {comm['audio_url']} | Browser fallback: {comm['use_browser_tts']}")
            
        if res['compression_occurred']:
            print("\n[CONTEXT COMPRESSION TRIGGERED]")
            print(f"  New Key Insights: {res['key_insights']}")
            
    print("\n" + "=" * 70)
    print("MULTI-AGENT COMMENTARY SIMULATION SUCCESSFUL!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
