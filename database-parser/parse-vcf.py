# @Author: Maxfield Kassel
# This script was written in Python 3.11.4
# I choose python because this is a cross platform language that is easy to maintain and update
# This script will parse a vcf file and output a csv file with the following columns:
# 1. Symbol?
# 2. Chromosome
# 3. Position
# 4. Consequences (comma separated) [Converted to numerical values]
# 5-n. [strain name] -1 if unknown, 0 if homozygous reference (0/0), 1 if homozygous alternate (1/1), 2 if heterozygous (0/1)

import os
import sys
import tkinter as tk
import tkinter.font as tk_font
import tkinter.filedialog as filedialog
from tkinter import ttk

# Ensure that this script is not imported
if __name__ != "__main__":
    print("This script is not meant to be imported")
    sys.exit(1)


def select_file(file_types, title, write=False):
    """
    Select a file and perform optional write operation.
    """
    kwargs = dict(initialdir=os.getcwd(), filetypes=file_types, title=title)
    if write:
        file = filedialog.asksaveasfilename(**kwargs)
        with open(file, "w") as f:
            f.write("{}")
    else:
        file = filedialog.askopenfilename(**kwargs)

    return file or None


def select_vfc_file():
    """
    Select a vcf file.
    """
    file = select_file(file_types=[("vcf files", "*.vcf"), ("all files", "*.*")], title="Select file")
    if file:
        root.vcf_file_name = file
        vcf_file_label.configure(text=file, fg="black")
        check_run_button_state()


def select_consequences(create=False):
    """
    Select a consequences file.
    """
    file = select_file(file_types=[("json files", "*.json"), ("all files", "*.*")], title="Select file", write=create)
    if file:
        root.consequences_file_name = file
        consequences_file_label.configure(text=file, fg="black")
        check_run_button_state()


def select_strains(create=False):
    """
    Select a strains file.
    """
    file = select_file(file_types=[("json files", "*.json"), ("all files", "*.*")], title="Select file", write=create)
    if file:
        root.strain_file_name = file
        strain_file_label.configure(text=file, fg="black")
        check_run_button_state()


def check_default_files():
    """
    Check if the default files exist.
    """
    # Get path of this script
    path = os.path.dirname(os.path.realpath(__file__))

    for file_name in ["consequences.json", "strains.json"]:
        file_path = os.path.join(path, "..", "web", "public", "data", file_name)
        label = consequences_file_label if file_name == "consequences.json" else strain_file_label
        root_attr = "consequences_file_name" if file_name == "consequences.json" else "strain_file_name"

        if os.path.isfile(file_path):
            setattr(root, root_attr, os.path.abspath(file_path))
            label.configure(text=os.path.abspath(file_path), fg="black")
        elif os.path.isdir(os.path.dirname(file_path)):
            with open(file_path, "w") as f:
                f.write("{}")
            setattr(root, root_attr, os.path.abspath(file_path))
            label.configure(text=os.path.abspath(file_path), fg="black")
    check_run_button_state()


def check_run_button_state():
    """
    Check if the run button should be enabled.
    """
    if hasattr(root, "vcf_file_name") and hasattr(root, "consequences_file_name") and hasattr(root, "strain_file_name"):
        run_button.configure(state="normal")
    else:
        run_button.configure(state="disabled")



def run():
    """
    Opens the VCF file and counts the number of lines, displays a loading dialog
    """
    vcf = open(root.vcf_file_name, "r")
    lines = 0
    for _ in vcf:
        lines += 1
    vcf.close()
    root.loading_window = tk.Toplevel(root)
    root.loading_window.title("Loading")
    root.loading_window.geometry("300x100")
    root.loading_window.resizable(False, False)
    root.loading_window.protocol("WM_DELETE_WINDOW", lambda: None)
    root.loading_window.grab_set()
    root.loading_window.focus_set()
    root.loading_window.columnconfigure(0, weight=1)
    root.loading_window.columnconfigure(1, weight=1)
    root.loading_window.columnconfigure(2, weight=1)
    root.loading_window.rowconfigure(0, weight=1)
    root.loading_window.rowconfigure(1, weight=1)
    root.loading_window.rowconfigure(2, weight=1)
    root.loading_window.rowconfigure(3, weight=1)
    root.loading_window.rowconfigure(4, weight=1)
    root.loading_window.rowconfigure(5, weight=1)

    # Create the loading label
    loading_label = tk.Label(root.loading_window, text="Loading...")
    loading_label.grid(column=1, row=1)

    # Create the progress bar
    progress_bar = tk.ttk.Progressbar(root.loading_window, orient="horizontal", length=200, mode="determinate", maximum=lines)
    progress_bar.grid(column=1, row=2)

    # Create the cancel button
    cancel_button = tk.Button(root.loading_window, text="Cancel", command=cancel)
    cancel_button.grid(column=1, row=3)


# Helper Functions

def create_button_grid(parent, text, command, column, row):
    button = tk.Button(parent, text=text, command=command)
    button.grid(column=column, row=row, sticky='nesw', padx=(1, 1), pady=(5, 5))
    return button


def create_label_grid(master, text, col, row, fg="black", anchor="center", columnspan=1):
    label = tk.Label(master, text=text, fg=fg, anchor=anchor)
    label.grid(column=col, row=row, sticky='w', columnspan=columnspan) 
    return label

# Main UI
root = tk.Tk()
root.title("VCF Parser")

# Set a bigger default font
default_font = tk_font.nametofont("TkDefaultFont")
default_font.configure(size=12)

# Set the grid weights
root.grid_columnconfigure(0, weight=1)
root.grid_columnconfigure(1, weight=1)
root.grid_columnconfigure(2, weight=1)
root.grid_rowconfigure(7, weight=1)

# Title
title_frame = tk.Frame(root)
title_frame.grid(column=0, row=0, columnspan=3)

title_label = create_label_grid(title_frame, "VCF Parser", 0, 0)
title_label.config(font=("Helvetica", 20), anchor='center')

# VCF file selection
vcf_label = create_label_grid(root, "Select a vcf file", 0, 1, fg="black", anchor='w',columnspan=2)
vcf_label.config(font=("Helvetica", 14))
create_button_grid(root, "Select file", select_vfc_file, 0, 2)
create_button_grid(root, "Create file", None, 1, 2).configure(state="disabled")

vcf_file_label = create_label_grid(root, "File not selected", 2, 2, fg="red", anchor='w')

# Consequences selection
consequences_label = create_label_grid(root, "Select a consequences file", 0, 3, fg="black", anchor='w', columnspan=2)
consequences_label.config(font=("Helvetica", 14))
create_button_grid(root, "Select file", select_consequences, 0, 4)
create_button_grid(root, "Create file", lambda: select_consequences(True), 1, 4)
consequences_file_label = create_label_grid(root, "File not selected", 2, 4, fg="red", anchor='w')

# Strains selection
strain_label = create_label_grid(root, "Select a strains file", 0, 5, fg="black", anchor='w', columnspan=2)
strain_label.config(font=("Helvetica", 14))
create_button_grid(root, "Select file", select_strains, 0, 6)
create_button_grid(root, "Create file", lambda: select_strains(True), 1, 6)
strain_file_label = create_label_grid(root, "File not selected", 2, 6, fg="red", anchor='w')

#Create a empty row
empty_row = tk.Frame(root, height=10)
empty_row.grid(column=0, row=7, columnspan=3)


# Run button
run_frame = tk.Frame(root)
run_frame.grid(column=0, row=8, columnspan=3)

# Create the Run button
run_button = tk.Button(run_frame, text="Run", command=run, width=20, bg='white', activebackground='white')
run_button.configure(width=20)
run_button.pack()

# Check if the default files exist
check_default_files()

# Check if the run button should be enabled
check_run_button_state()

# Run the window
root.mainloop()