# Annotation Tooling

This repository provides a simple workflow for preparing data and running Label Studio for annotation.

---

## 1. Setup & Run

There are two ways to run Label Studio: **locally** or with **Docker**.
For docker that take long time to build.
```bash

### Option A: Run with Docker (Recommended)

To run Label Studio with optimized performance (using Caddy reverse proxy):

**For non-dev users (no Node/Yarn needed)**:
Everything is built inside Docker — just run these two commands:
```bash
make docker-build
make docker-up
```

**For developers (faster, requires Node/Yarn on host)**:
This pre-builds the frontend on your host machine (native speed) before starting Docker.
```bash
make docker-fast
make docker-up
```

**Common Commands**:
| Action | Command |
| --- | --- |
| View logs | `make docker-logs` |
| Stop services | `make docker-down` |
| Full reset (delete all history/data) | `make docker-clean` |

**Access in browser**:
```
http://localhost:8080
```


### Option B: Run Locally (two terminals required)

#### Create virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Start backend (first terminal).

```bash
pip install poetry
poetry install
python label_studio/manage.py migrate
python label_studio/manage.py collectstatic
# Start the server in development mode at http://localhost:8080
python label_studio/manage.py runserver
```

### Start frontend (second terminal).

Open in browser:

```bash
cd web
yarn install
yarn dev
```

### Label Studio.

```
http://localhost:8080 
```

---

## 2. Data Preparation

### Install dependencies

```bash
pip install -r requirements.txt
```
Label Studio expects data in **JSON format**.

The hierarchical data in the Excel file we received is intended for human visualization. We filter and convert it into a JSON format that Label Studio can understand. This is a two-step process.

All settings (file paths, sheet names, column names) are defined in `config/settings.yaml`.

### Step A: Build the AS-IS → TO-BE mapping

The **gold-standard Excel** (`mapping_information.xlsx`, with both `as_is_*` and `to_be_*` columns) is used to create a lookup mapping:

```bash
PYTHONPATH=. python scripts/generate_mapping.py
```

This produces the mapping JSON defined in `settings.yaml` → `mapping.output`.

### Step B: Convert Excel → Label Studio JSON

The **real-world Excel** (`demo_data.xlsx`) may use different column names than the mapping file. For example:

| ホールディングス対象 | NewCode1 | **NewName1** | NewCode2 | **NewName2** | NewCode3 | **NewName3** | NewCode4 | NewName4 | BAPC |

The `column_mapping` in `settings.yaml` translates the input columns to the standard AS-IS names used in the mapping:

```yaml
column_mapping:
  NewName1: as_is_lv1 # Excel column → standard name
  NewName2: as_is_lv2
  NewName3: as_is_lv3
```

Run:

```bash
PYTHONPATH=. python scripts/convert_excel_to_labelstudio_json.py
```

Options:

```bash
PYTHONPATH=. python scripts/convert_excel_to_labelstudio_json.py --on-missing skip   # drop rows without a mapping
PYTHONPATH=. python scripts/convert_excel_to_labelstudio_json.py --on-missing error  # abort if any row is unmapped
```

Raw Excel files should be placed in:

```
data/raw/*.xlsx
```

The processed JSON will be saved in:

```
data/processed/
```

---

## 3. Troubleshooting

### Port already in use (8080)

Check which process is using the port:

```bash
lsof -i :8080
```

Kill the process:

```bash
kill -9 <PID>
```

---

### Reset Label Studio (delete all data)

To remove all existing data (accounts, projects, media):

```bash
rm -rf ~/.local/share/label-studio
```

Then restart

---

## 5. Using Label Studio

### Step 1: Create an Account and Log In

- Click on "Sign Up" to create a new account, or "Log In" if you already have one.

### Step 2: Create a New Project

- After logging in, click on **"Create Project"** to start a new annotation project.
- **Project Name**: Provide a name and description for your project.
- **Data Import**: Upload the JSON file you prepared in the previous steps.
- **Labeling Interface**: Choose a labeling interface template that suits your annotation needs, or customize your own (for example, use the template in `config/label_config.xml` by copying and pasting).
- Click **"Save"** in the top right to create the project.

### Step 3: Start Annotating

- Click on your project to open it.
- You will see a list of items to annotate. Click on an item to start annotating.
- If an annotation is incorrect, you can select the correct label.

### Step 4: Export Annotations

- Once you have completed the annotation, you can export the results in `.csv` or `.json` format by clicking **"Export"** in the top right.

### Step 5: Convert Exported Annotations Back to Excel (Optional)

- If you need to convert the annotated JSON back to Excel format, you can use the `scripts/mapping_exportation.py` script .
