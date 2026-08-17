import re

with open('backend/server.py', 'r') as f:
    content = f.read()

# For Product
content = re.sub(
    r'(class Product\(BaseModel\):[\s\S]*?combo_groups: Optional\[List\[ComboGroup\]\] = \[\])',
    r'\1\n    ui_sections: Optional[List[Any]] = []\n    global_group_ids: Optional[List[str]] = []',
    content
)

# For ProductCreate
content = re.sub(
    r'(class ProductCreate\(BaseModel\):[\s\S]*?combo_groups: Optional\[List\[ComboGroup\]\] = \[\])',
    r'\1\n    ui_sections: Optional[List[Any]] = []\n    global_group_ids: Optional[List[str]] = []',
    content
)

with open('backend/server.py', 'w') as f:
    f.write(content)
