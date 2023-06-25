# vcf2csv
vcf2csv is a utility tool designed to convert VCF files into CSV format. The tool comes with options to specify paths for input and output files, enable debug mode, and more. This open-source project is released under the MIT license.

## Installation Guide

## Prerequisites
- A C++ compiler that supports C++17
- Make

If you already have a C++ compiler and Make installed, you can skip the "Prerequisites Installation" section.

## Prerequisites Installation

### Windows
Consider using [MinGW](http://www.mingw.org/) or [Visual Studio](https://visualstudio.microsoft.com/vs/).

### Linux
Options include [GCC](https://gcc.gnu.org/), [Clang](https://clang.llvm.org/), or [Intel C++ Compiler](https://software.intel.com/en-us/c-compilers).

### MacOS
You can use [Xcode](https://developer.apple.com/xcode/), which includes both a C++ compiler and Make.

## Building the Project

### Windows

#### If Using MinGW
1. Open command line.
2. Navigate to the project directory.
3. Run `mingw32-make`.

#### If Using Visual Studio
1. Open command line.
2. Navigate to the project directory.
3. Run `nmake`.

### Linux (GCC or Clang)

1. Open command line.
2. Navigate to the project directory.
3. Run `make`.

### MacOS (Xcode)

1. Open command line.
2. Navigate to the project directory.
3. Run `make`.

## Running the Program

Here's how to use the program:

~~~
Usage: ./vcf2csv <vcf-file> [options]

Options:
  --consequence-file <file>    Specify the path to the consequence file (default: ../web/public/data/consequences.json)
  --strain-file <file>         Specify the path to the strain file (default: ../web/public/data/strains.json)
  --output-file <file>         Specify the path to the output file (default: output.csv)
  --debug                      Enable debug mode
  -h, --help                   Display this help message
~~~

### Windows
1. Open command line.
2. Navigate to the project directory.
3. Run `vcf2csv.exe <VCF file path>`.

### Linux
1. Open command line.
2. Navigate to the project directory.
3. Run `./vcf2csv <VCF file path>`.

### MacOS
1. Open command line.
2. Navigate to the project directory.
3. Run `./vcf2csv <VCF file path>`.

## Examples

Here are a few examples of common use cases:


### Example 1: Basic usage
~~~
./vcf2csv example.vcf
~~~

### Example 2: Enabling debug mode and specifying output file
~~~
./vcf2csv example.vcf --debug --output-file output.csv
~~~

## License

This project is licensed under the XYZ license. See the [LICENSE](../LICENSE) file for details.
