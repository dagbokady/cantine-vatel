from fastapi import FastAPI
app = FastAPI(title="Cantine Vatel")

@app.get("/health")
def health():
    return {"status": "ok"}