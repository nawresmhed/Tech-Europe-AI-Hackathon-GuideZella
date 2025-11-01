import json
import os

from aci import ACI
from aci.meta_functions import ACISearchFunctions
from aci.types.functions import FunctionDefinitionFormat

from dotenv import load_dotenv

from rich import print as rprint
from rich.panel import Panel

from flask import Flask, Response, stream_with_context, request, jsonify, Response
from flask_cors import CORS

from openai import OpenAI

from elevenlabs.client import ElevenLabs

load_dotenv()
LINKED_ACCOUNT_OWNER_ID = os.getenv("LINKED_ACCOUNT_OWNER_ID", "")
if not LINKED_ACCOUNT_OWNER_ID:
    raise ValueError("LINKED_ACCOUNT_OWNER_ID is not set")

openai = OpenAI()

elevenlabs = ElevenLabs()

aci = ACI()
app = Flask(__name__)
CORS(app)


prompt = """
You are GuideZella, a friendly and intelligent AI guide. You specialize in helping users find locations, routes and recommendations.
- Always make the reponse sound like a human conversation, your output will be played as voice.
- If the user asks for menus, movies playing in a cinema, reviews, events, or other detailed content, crawl the web to retrieve accurate, current information.
- Always include relevant images of the places or businesses you recommend, if available.
- Summarize and present web-crawled content in a clear, user-friendly format.
- Be concise, polite, and helpful. Adapt your answers based on the user s location, preferences, or mode of transportation when relevant.
- If the place is not found or information is unavailable, let the user know and offer alternatives or tips to refine the search.
"""

tools_meta = [
    aci.functions.get_definition("GOOGLE_MAPS__TEXT_SEARCH"),
    aci.functions.get_definition("GOOGLE_MAPS__GET_DIRECTIONS"),
    aci.functions.get_definition("BRAVE_SEARCH__WEB_SEARCH"),
    aci.functions.get_definition("BRAVE_SEARCH__IMAGE_SEARCH"),
    aci.functions.get_definition("BRAVE_SEARCH__NEWS_SEARCH"),
    aci.functions.get_definition("FIRECRAWL__SEARCH"),
    aci.functions.get_definition("FIRECRAWL__SCRAPE"),
    aci.functions.get_definition("FIRECRAWL__EXTRACT"),
]

@app.route("/tts", methods=["GET"])
def tts():
    text = request.args.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    audio_stream = elevenlabs.text_to_speech.stream(
        text=text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        model_id="eleven_multilingual_v2"
    )
    return Response(audio_stream, content_type="audio/mpeg")

@app.route("/chat", methods=["POST"])
def chat():
    tools_retrieved: list[dict] = []
    chat_history: list[dict] = []
    
    user_input = request.json.get("message", "").strip()
    if not user_input:
        return jsonify({"error": "No message provided"}), 400
    
    @stream_with_context
    def generate():
        chat_history.append({
            "role": "user",
            "content": user_input,
        })
        
        while True:
            rprint(Panel("Waiting for LLM Output", style="bold blue"))
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": prompt,
                    },
                ]
                + chat_history,
                tools=tools_meta + tools_retrieved,
                parallel_tool_calls=False,
            )

            # Process LLM response and potential function call (there can only be at most one function call)
            content = response.choices[0].message.content
            tool_call = (
                response.choices[0].message.tool_calls[0]
                if response.choices[0].message.tool_calls
                else None
            )
            if content:
                rprint(Panel("LLM Message", style="bold green"))
                rprint(content)
                yield f"{content}\n\n"
                chat_history.append({"role": "assistant", "content": content})

            # Handle function call if any
            if tool_call:
                rprint(
                    Panel(f"Function Call: {tool_call.function.name}", style="bold yellow")
                )
                rprint(f"arguments: {tool_call.function.arguments}")

                chat_history.append({"role": "assistant", "tool_calls": [tool_call]})
                result = aci.handle_function_call(
                    tool_call.function.name,
                    json.loads(tool_call.function.arguments),
                    linked_account_owner_id=LINKED_ACCOUNT_OWNER_ID,
                    allowed_apps_only=True,
                    format=FunctionDefinitionFormat.OPENAI,
                )
                # if the function call is a get, add the retrieved function definition to the tools_retrieved
                if tool_call.function.name == ACISearchFunctions.get_name():
                    tools_retrieved.extend(result)

                rprint(Panel("Function Call Result", style="bold magenta"))
                rprint(result)
                # Continue loop, feeding the result back to the LLM for further instructions
                chat_history.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result),
                    }
                )
            else:
                # If there's no further function call, exit the loop
                rprint(Panel("Task Completed", style="bold green"))

                yield ""
                break

    return Response(generate(), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True)
