# Training Blueprint: Rechly Local German AI Model (Rechly-DE-3B)

This document contains the **complete blueprint, synthetic data generation prompt, training pipeline, and Ollama integration** to fine-tune a specialized, 100% local, GDPR/DSGVO-compliant German accounting model for Rechly.

---

## 1. Architecture & Model Selection

| Specification | Recommendation |
| :--- | :--- |
| **Base Model** | `Qwen/Qwen2.5-3B-Instruct` (or `meta-llama/Llama-3.2-3B-Instruct`) |
| **Why 3B?** | Fits into **< 2.5 GB RAM** when quantized (Q4_K_M). Runs at **60+ tokens/sec** on MacBook (M1/M2/M3/M4) and CPU servers. Far higher JSON fidelity than 1B models. |
| **Fine-Tuning Method** | **QLoRA** with [Unsloth](https://github.com/unslothai/unsloth) (Google Colab / Linux) or [MLX](https://github.com/ml-explore/mlx-examples) (Apple Silicon). |
| **Training Time & Cost** | ~30 minutes on a free Google Colab T4 GPU (**$0 cost**). |
| **Target Export** | Single GGUF file (`rechly-de-3b-Q4_K_M.gguf`, ~1.9 GB). |

---

## 2. Master Prompt: Synthetic Dataset Generation

Use this prompt with a frontier LLM (Claude 3.5 Sonnet, GPT-4o, or Gemini 1.5 Pro) to generate 1,500–3,000 diverse training examples in **ShareGPT JSONL format**.

```markdown
You are a German Tax Advisor (Steuerberater) and Senior Machine Learning Engineer building a specialized training dataset for "Rechly-DE-3B", an open-source German invoicing and bookkeeping model.

Generate 50 diverse training pairs in ShareGPT JSON format covering the 5 core domains below. All German texts must follow German GoBD standards, official tax laws (UStG), and standard B2B business etiquette.

### Domain 1: Text-to-Invoice (Strict JSON Extraction)
- Input: Natural, colloquial German sentence describing an invoice (e.g. "Rechnung an WebTech GmbH: 14 Stunden Frontend-Entwicklung à 95€ und 1x SSL Zertifikat Pauschal 60€, zahlbar in 14 Tagen mit 2% Skonto").
- Output: Strict JSON matching this schema:
{
  "client_name": "string",
  "due_days": number,
  "payment_terms": "string",
  "notes": "string",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unit_of_measure": "Stunde" | "Stück" | "Tag" | "Pauschal" | "Monat",
      "price": number,
      "tax_rate_percent": 19 | 7 | 0
    }
  ]
}

### Domain 2: B2B Line Item Description Rewriter
- Input: Rough, informal notes (e.g. "website schneller gemacht und datenbank geputzt").
- Output: Formal, professional, audit-compliant description (e.g. "Performance-Optimierung der Webpräsenz: Bereinigung und Indexierung relationaler Datenbanktabellen sowie Ladezeitreduktion").

### Domain 3: German Tax & GoBD Compliance Notes
- Input: Invoice parameters (e.g. "Kleinunternehmer", "Bauleistung an Generalunternehmer", "B2B Kunde in Österreich mit ATU-Nummer").
- Output: The legally mandated German statutory clause:
  - § 19 UStG: "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung)."
  - § 13b UStG: "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge / § 13b UStG)."
  - Innergemeinschaftlich: "Steuerfreie innergemeinschaftliche Lieferung gem. § 4 Nr. 1b i.V.m. § 6a UStG."

### Domain 4: Mahnwesen (Dunning Letters)
- Input: Invoice number, client name, overdue days, amount.
- Output: Tone-appropriate German payment reminder:
  - Stufe 1: Freundliche Zahlungserinnerung (sachlich, partnerschaftlich).
  - Stufe 2: 1. Mahnung (konkrete Nachfrist von 7 Tagen).
  - Stufe 3: 2. Mahnung / Letzte Mahnung (Bestimmt, Ankündigung gerichtlicher Schritte).

### Domain 5: SKR03 / SKR04 Expense Categorization
- Input: Receipt description (e.g. "Geschäftsessen mit Kunde im Restaurant Osteria 120€").
- Output: Structured JSON:
{
  "category": "Bewirtung",
  "vat_rate": 19,
  "deductible_percent": 70,
  "skr03_account": "4650",
  "skr04_account": "6640",
  "note": "Geschäftliche Bewirtungskosten: 70% steuerlich abzugsfähig, 100% Vorsteuerabzug."
}

Format each example as a single JSON line:
{"conversations": [{"from": "human", "value": "..."}, {"from": "gpt", "value": "..."}]}
```

---

## 3. Dataset Generation Script (`scripts/generate_dataset.py`)

Run this Python script to synthesize your training data using the Anthropic, OpenAI, or OpenRouter API:

```python
"""
Rechly Dataset Generator: Generates synthetic German accounting training data.
Run: pip install openai
"""
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

PROMPT_CATEGORIES = [
    ("text_to_invoice", 500),
    ("line_item_enhancement", 300),
    ("tax_exemption_clauses", 200),
    ("dunning_reminders", 200),
    ("skr03_skr04_expenses", 300),
]

def generate_batch(category: str, count: int):
    system = "You are an expert German Steuerberater and AI training dataset engineer."
    prompt = f"Generate 5 unique training pairs for category '{category}' in ShareGPT format: {{\"conversations\": [{{\"from\": \"human\", \"value\": \"...\"}}, {{\"from\": \"gpt\", \"value\": \"...\"}}]}}. Output valid JSON lines only."
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    output_file = "rechly_german_accounting.jsonl"
    print(f"Generating training data into {output_file}...")
    with open(output_file, "a", encoding="utf-8") as f:
        for cat, target in PROMPT_CATEGORIES:
            print(f"Generating {cat}...")
            # Repeat to reach target count
            chunk = generate_batch(cat, 5)
            for line in chunk.splitlines():
                if line.strip().startswith("{") and line.strip().endswith("}"):
                    f.write(line.strip() + "\n")
    print("Done! Dataset ready.")
```

---

## 4. Fine-Tuning Pipeline (Unsloth on Google Colab / GPU)

Create a Colab notebook and run the following script:

```python
# 1. Install Unsloth & dependencies
!pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

# 2. Load Base Model in 4-bit (Qwen 2.5 3B Instruct)
from unsloth import FastLanguageModel
import torch

max_seq_length = 2048
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-3B-Instruct",
    max_seq_length=max_seq_length,
    load_in_4bit=True,
)

# 3. Apply LoRA Adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=32,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
)

# 4. Format Dataset
from datasets import load_dataset
dataset = load_dataset("json", data_files="rechly_german_accounting.jsonl", split="train")

def formatting_prompts_func(examples):
    convs = examples["conversations"]
    texts = []
    for conv in convs:
        text = tokenizer.apply_chat_template(conv, tokenize=False, add_generation_prompt=False)
        texts.append(text)
    return {"text": texts}

dataset = dataset.map(formatting_prompts_func, batched=True)

# 5. Train Model
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=max_seq_length,
    dataset_num_proc=2,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        max_steps=120, # or 3 epochs
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="rechly_model_outputs",
    ),
)
trainer.train()

# 6. Save and Export to GGUF (for Ollama)
model.save_pretrained_gguf("rechly-de-3b", tokenizer, quantization_method="q4_k_m")
print("GGUF model exported successfully!")
```

---

## 5. Attaching the Model to Rechly with Ollama

Once your `.gguf` file is saved (e.g. `rechly-de-3b-q4_k_m.gguf`):

### 1. Create a `Modelfile`
Create a file named `Modelfile` in the same directory as the `.gguf`:

```dockerfile
FROM ./rechly-de-3b-q4_k_m.gguf

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ .Response }}<|im_end|>
"""

PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER temperature 0.2
PARAMETER top_p 0.95

SYSTEM """Du bist der offizielle Rechly KI-Buchhaltungsassistent für Deutschland.
Du erstellst präzise, GoBD-konforme Rechnungsdaten im exakten JSON-Format und formulierst professionelle deutsche Geschäftskorrespondenz."""
```

### 2. Register the Model in Ollama
Run this command in your terminal:
```bash
ollama create rechly-de-3b -f Modelfile
```

Test it in CLI:
```bash
ollama run rechly-de-3b "Rechnung an Müller GmbH: 10 Std. Beratung à 120€, zahlbar in 14 Tagen"
```

### 3. Connect to Rechly
1. Start Rechly and go to **Einstellungen $\to$ KI** (`/dashboard/settings`).
2. Select Provider: **Ollama (Lokal / DSGVO-konform)**.
3. In the Model field, select or type: `rechly-de-3b`.
4. Click **KI-Einstellungen speichern** and **KI testen**.
5. All invoice assistants, OCR fallbacks, and the **Text-zu-Rechnung** bar on `/dashboard/invoices/create` will now run completely locally on your private model!
