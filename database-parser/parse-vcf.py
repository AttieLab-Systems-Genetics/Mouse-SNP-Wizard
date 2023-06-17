# @Author: Maxfield Kassel
# This script was written in Python 3.11.4
# I choose python because this is a cross platform language that is easy to maintain and update
# This script will parse a vcf file and output a csv file with the following columns:
# 1. Symbol?
# 2. Chromosome
# 3. Position
# 4. Consequences (comma separated) [Converted to numerical values]
# 5-n. [strain name] -1 if unknown, 0 if homozygous reference (0/0), 1 if homozygous alternate (1/1), 2 if heterozygous (0/1)

import tkinter as tk
from tkinter import filedialog
import os
import sys
import subprocess
import vcf

# Ensure that this script is not imported
if __name__ != "__main__":
    print("This script is not meant to be imported")
    sys.exit(1)


def select_vfc_file():
    """
    Select a vcf file
    """
    file = filedialog.askopenfilename(initialdir=os.getcwd(
    ), title="Select file", filetypes=(("vcf files", "*.vcf"), ("all files", "*.*")))
    if file == "":
        return
    root.vcf_file_name = file
    vcf_file_label.configure(text=root.vcf_file_name, fg="black")


def select_consequences(create=False):
    """
    Select a consequences file

    Keyword Arguments:
    create (bool): If true, create a new file
    """
    if create:
        file = filedialog.asksaveasfilename(initialdir=os.getcwd(
        ), title="Select file", filetypes=(("json files", "*.json"), ("all files", "*.*")))
    else:
        file = filedialog.askopenfilename(initialdir=os.getcwd(
        ), title="Select file", filetypes=(("json files", "*.json"), ("all files", "*.*")))

    if file == "":
        return
    if create:
         with open(file, "w") as file:
            file.write("{}")
    root.consequences_file_name = file
    consequences_file_label.configure(text=root.consequences_file_name, fg="black")


def select_strains(create=False):
    """
    Select a strains file

    Parameters:
    create (bool): If true, create a new file
    """
    if create:
        file = filedialog.asksaveasfilename(initialdir=os.getcwd(
        ), title="Select file", filetypes=(("json files", "*.json"), ("all files", "*.*")))
    else:
        file = filedialog.askopenfilename(initialdir=os.getcwd(
        ), title="Select file", filetypes=(("json files", "*.json"), ("all files", "*.*")))
    if file == "":
        return
    if create:
        with open(file, "w") as file:
            file.write("{}")
    root.strain_file_name = file
    strain_file_label.configure(text=root.strain_file_name, fg="black")


def check_default_files():
    """
    Check if the default files exist
    """
    # Get path of this script
    path = os.path.dirname(os.path.realpath(__file__))
    if os.path.isfile(path+"/../web/public/data/consequences.json"):
        root.consequences_file_name = os.path.abspath(path+"/../web/public/data/consequences.json")
        consequences_file_label.configure(text=root.consequences_file_name, fg="black")
    elif os.path.isdir(path + "/../web/public/data"):
        with open(path + "/../web/public/data/consequences.json", "w") as file:
            file.write("{}")
        root.consequences_file_name = os.path.abspath(path+"/../web/public/data/consequences.json")
        consequences_file_label.configure(text=root.consequences_file_name, fg="black")
    
    if os.path.isfile(path+"/../web/public/data/strains.json"):
        root.strain_file_name = os.path.abspath(path+"/../web/public/data/strains.json")
        strain_file_label.configure(text=root.strain_file_name, fg="black")
    elif os.path.isdir(path + "/../web/public/data"):
        with open(path + "/../web/public/data/strains.json", "w") as file:
            file.write("{}")
        root.strain_file_name = os.path.abspath(path+"/../web/public/data/strains.json")
        strain_file_label.configure(text=root.strain_file_name, fg="black")
        



def check_run_button_state():
    """
    Check if the run button should be enabled
    """
    if hasattr(root, "vcf_file_name") and hasattr(root, "consequences_file_name") and hasattr(root, "strain_file_name"):
        run_button.configure(state="normal")
    else:
        run_button.configure(state="disabled")


def run():
    print("Running script")


# Create the window
root = tk.Tk()

# Create title label
title_label = tk.Label(root, text="VCF Parser")
title_label.grid(column=1, row=0)

# VCF file selection
vcf_label = tk.Label(root, text="Select a vcf file")
vcf_label.grid(column=0, row=1)
vcf_button = tk.Button(root, text="Select file", command=select_vfc_file)
vcf_button.grid(column=0, row=2)
vcf_file_label = tk.Label(root, text="File not selected", fg="red")
vcf_file_label.grid(column=1, row=2)

# Consequences selection
consequences_label = tk.Label(root, text="Select a consequences file")
consequences_label.grid(column=0, row=3)
consequences_button = tk.Button(root, text="Select file", command=select_consequences)
consequences_button.grid(column=0, row=4)
consequences_create_button = tk.Button(root, text="Create file", command=lambda: select_consequences(True))
consequences_create_button.grid(column=1, row=4)
consequences_file_label = tk.Label(root, text="File not selected", fg="red")
consequences_file_label.grid(column=2, row=4)

# Strains selection
strain_label = tk.Label(root, text="Select a strains file")
strain_label.grid(column=0, row=5)
strain_button = tk.Button(root, text="Select file", command=select_strains)
strain_button.grid(column=0, row=6)
strain_create_button = tk.Button(root, text="Create file", command=lambda: select_strains(True))
strain_create_button.grid(column=1, row=6)
strain_file_label = tk.Label(root, text="File not selected", fg="red")
strain_file_label.grid(column=2, row=6)

# Run button
run_button = tk.Button(root, text="Run", command=run)
run_button.grid(column=1, row=7)


# Check if the default files exist
check_default_files()

# Check if the run button should be enabled
check_run_button_state()

# Run the window
root.mainloop()
