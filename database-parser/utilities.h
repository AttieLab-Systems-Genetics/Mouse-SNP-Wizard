#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <fstream>
#include <cstring>
#include <algorithm>
#include <chrono>

using namespace std;

bool debug = false;

void help()
{
    cout << "Usage: ./vcf2csv <vcf-file> [options]" << endl;
    cout << "Options:" << endl;
    cout << "  --consequence-file <file>    Path to the consequence file" << endl;
    cout << "  --strain-file <file>         Path to the strain file" << endl;
    cout << "  --output-file <file>         Path to the output file" << endl;
    cout << "  --debug                      Enable debug mode" << endl;
    cout << "  -h, --help                   Display this help message" << endl;
}

vector<string> split(const string &str, char delimiter)
{
    vector<string> tokens;
    string token;
    istringstream tokenStream(str);
    while (getline(tokenStream, token, delimiter))
    {
        tokens.push_back(token);
    }
    return tokens;
}

string formatInt(int number)
{
    string formattedNumber = to_string(number);
    int length = formattedNumber.length();
    for (int i = length - 3; i > 0; i -= 3)
    {
        formattedNumber.insert(i, ",");
    }
    return formattedNumber;
}

void progressBar(int length, int currentLines, int estimatedLines, long timeElapsed)
{
    long percent = currentLines * 100 / estimatedLines;

    if (!debug) // Only print the progress bar if debug mode is disabled
    {
        cout << "\r[";
        // Print the progress bar
        int pos = length * percent / 100;
        for (int i = 0; i < length; ++i)
        {
            if (i < pos)
                cout << "=";
            else if (i == pos)
                cout << ">";
            else
                cout << " ";
        }

        cout << "] " << percent << "% ";
    }
    cout << "Current line: " << currentLines << "/" << estimatedLines << " ETR: ";

    if (percent == 0)
    {
        cout << "Calculating...";
        if (debug) cout << "\n";
        cout.flush();
        
        return;
    }

    // Display time remaining
    long timeRemaining = (timeElapsed / percent) * (100 - percent);
    int seconds = int(timeRemaining / 1000);
    int minutes = int(seconds / 60);
    int hours = int(minutes / 60);
    int days = int(hours / 24);

    if (days > 0)
        cout << days << "d ";
    if (hours > 0)
        cout << hours % 24 << "h ";
    if (minutes > 0)
        cout << minutes % 60 << "m ";
    cout << seconds % 60 << "s     ";
    if (debug)
        cout << "\n";
    cout.flush();
    return;
}

vector<string> loadArrayFromFile(string filePath)
{
    // Load the values from a file into an array
    // The values are surrounded by quotes and separated by commas
    // The file starts with a [ and ends with a ]
    // The file can have any number of lines and any number of whitespace characters
    vector<string> fields;
    ifstream f(filePath);
    string line;
    while (getline(f, line))
    {
        // Remove whitespace
        line.erase(remove_if(line.begin(), line.end(), ::isspace), line.end());
        // Remove quotes
        line.erase(remove(line.begin(), line.end(), '\"'), line.end());
        // Remove brackets
        line.erase(remove(line.begin(), line.end(), '['), line.end());
        line.erase(remove(line.begin(), line.end(), ']'), line.end());
        // Split the line into fields
        vector<string> splitLine = split(line, ',');
        // Add the fields to the array
        fields.insert(fields.end(), splitLine.begin(), splitLine.end());
    }
    f.close();
    if (debug) cout << "Loaded " << fields.size() << " fields from " << filePath << endl;
    return fields;
}

void writeArrayToFile(string filePath, vector<string> fields)
{
    ofstream f;
    f.open(filePath);
    f << "[";
    for (int i = 0; i < fields.size(); i++)
    {
        f << "\n\t\"" << fields[i] << "\",";
    }
    f.seekp(-1, f.cur);
    f << "\n]";
    f << endl;
    f.close();
    if (debug) cout << "Wrote " << fields.size() << " fields to " << filePath << endl;
}