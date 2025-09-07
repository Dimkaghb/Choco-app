import pandas as pd
import os 


def parse_structure(structure: str , file_path: str) -> List[Dict[str, Any]]:

    """
    Parse the structure string into a list of dictionaries.
    """
    lines = structure.strip().split('\n')
    result = []
    file = file_path.split('/')[-1]

    content = pd.read_docx(file_path)
