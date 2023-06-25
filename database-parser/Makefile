UNAME_S := $(shell uname -s)

EXE = vcf2csv
CXX = g++

ifeq ($(UNAME_S),Darwin)
    CXX=clang++
endif
ifeq ($(UNAME_S),Windows_NT)
    CXX=x86_64-w64-mingw32-g++
    EXE=vcf2csv.exe
	OPTIONAL_PARAMS=-static-libgcc -static-libstdc++
endif

all: vcf2csv.cpp utilities.h
	$(CXX) -std=c++11 -O3 -o $(EXE) vcf2csv.cpp $(OPTIONAL_PARAMS)

clean:
	rm $(EXE)
