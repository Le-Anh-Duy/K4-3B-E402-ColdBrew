from pathlib import Path
import json
from fastapi import APIRouter, HTTPException
from ..schemas.graph_schemas import TreeResponse, TreeNode

router = APIRouter(prefix="/graph", tags=["BE2 - Cây Tri Thức"])

DATA_TREE_PATH = Path(__file__).resolve().parent.parent / "data" / "tree.json"

@router.get("/tree", response_model=TreeResponse)
def get_tree():
    """
    Trả về toàn bộ Cây tri thức 15-30 concept từ Slide Day 1 & Day 2.
    Gồm định danh, nhãn, node cha-con và trích dẫn số trang slide (page).
    """
    if not DATA_TREE_PATH.exists():
        raise HTTPException(status_code=500, detail="Không tìm thấy tree.json")
    with open(DATA_TREE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    nodes = {k: TreeNode(**v) for k, v in data.items()}
    return TreeResponse(nodes=nodes)
