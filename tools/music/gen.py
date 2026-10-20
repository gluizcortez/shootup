import sys, json, time, torch
torch.set_num_threads(4)
from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music

jobs = json.load(open(sys.argv[1]))
dit = AceStepHandler()
print(dit.initialize_service(project_root=sys.argv[2] if len(sys.argv) > 2 else ".", config_path="acestep-v15-turbo", device="cpu"), flush=True)
llm = LLMHandler()
for j in jobs:
    t = time.time()
    params = GenerationParams(caption=j["caption"], lyrics="[Instrumental]", instrumental=True, bpm=j["bpm"],
        keyscale=j.get("key", ""), timesignature="4", duration=j["duration"], inference_steps=8, shift=3.0,
        seed=j["seed"], thinking=False, use_cot_metas=False, use_cot_caption=False, use_cot_language=False)
    cfg = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[j["seed"]], audio_format="wav")
    r = generate_music(dit, llm, params, cfg, save_dir=f"out/{j['id']}")
    print(j["id"], r.success, r.error, [a["path"] for a in r.audios] if r.success else None, round(time.time() - t), "s", flush=True)
