#include <filesystem>
#include <unordered_map>
#include <map>
#include "utilities.h"

using namespace std;
using namespace chrono;

map<int, int> parseHeader(ofstream &outputFile, string header, vector<string> *strains)
{
    // Split the header line into fields
    stringstream ss(header);
    string buffer;
    vector<string> fields;
    outputFile << "symbol,chromosome,position,consequence,";
    // Map the index of the strain to the index of the saved strain
    map<int, int> strainMap;
    while (getline(ss, buffer, '\t'))
    {
        fields.push_back(buffer);
    }
    if (debug)
    {
        for (int i = 0; i < strains->size(); i++)
        {
            cout << "Strain " << i << ": " << strains->at(i) << endl;
        }
    }
    // Extract the strain names
    for (int i = 9; i < 61; i++)
    {
        // If the strain is not in the saved strains, add it to the end of the file
        if (find(strains->begin(), strains->end(), fields[i]) == strains->end())
        {
            if (debug)
                cout << "Strain " << fields[i] << " not found in saved strains, adding to end of file" << endl;
            strains->push_back(fields[i]);
        }
        // Get the index of the strain
        int strainIndex = find(strains->begin(), strains->end(), fields[i]) - strains->begin();
        strainMap[i - 9] = strainIndex;
        outputFile << fields[i] << ",";
    }
    // Remove the last comma
    outputFile.seekp(-1, outputFile.cur);
    outputFile << endl;
    return strainMap;
}

void parseVCF(string filePath, string consequencesPath, string strainsPath, string outputPath)
{
    // Create a new csv file
    ofstream f;
    f.open(outputPath);

    auto start_time = high_resolution_clock::now();

    unordered_map<string, int> consq_map;
    vector<string> consq = loadArrayFromFile(consequencesPath);
    for (int i = 0; i < consq.size(); i++)
    {
        consq_map[consq[i]] = i;
        if (debug)
        cout << "Found consequence " << consq[i] << " with id " << i << endl;
    }

    vector<string> savedStrains = loadArrayFromFile(strainsPath);
    map<int, int> strainMap;

    ifstream fr(filePath);
    string line;
    int count = 0;

    // Get file length
    fr.seekg(0, ios::end);
    ifstream::pos_type fileLength = fr.tellg();
    fr.seekg(0, ios::beg);
    // Estimated lines
    int estimatedLines = fileLength / 2200; // This is around the length of a line
    int *strains = new int[savedStrains.size()];
    map<string, int> val_conversion = {{"0/0", 0}, {"0|0", 0}, {"1/1", 1}, {"1|1", 1}, {"0/1", 2}, {"0|1", 2}, {"1|0", 2}, {"1/0", 2}};
    long startMills = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    while (getline(fr, line))
    {
        if (line[0] == '#')
        {
            if (line[1] != '#')
            {
                strainMap = parseHeader(f, line, &savedStrains); // Returns the strain map from header
            }
            continue;
        }
        count++;
        if (count % 10000 == 0)
        {
            long endMills = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
            progressBar(50, count, estimatedLines, endMills - startMills);
        }

        vector<string> fields = split(line, '\t');

        // Extract chromosome, position, and symbol
        vector<string> info = split(fields[7], '|');

        string chromosome = fields[0];
        string position = fields[1];
        string Symbol = info[3];
        vector<string> ConsequenceArray = split(info[1], '&');

        // Extract the consequence
        string Consequence;
        for (auto const &c : ConsequenceArray)
        {
            auto it = consq_map.find(c);
            if (it == consq_map.end())
            {
                int new_id = consq_map.size();
                consq_map[c] = new_id;
                consq.push_back(c);
                it = consq_map.find(c);
                if (debug)
                    cout << "FOUND NEW CONSEQUENCE: " << c << " with id " << new_id << endl;
            }
            Consequence += to_string(it->second);
            Consequence += ',';
        }
        Consequence.pop_back(); // remove the last comma

        // Fill the strains array with -1
        fill(strains, strains + savedStrains.size(), -1);
        for (int i = 9; i < 61; i++)
        {
            string val = fields[i].substr(0, fields[i].find(':'));
            auto it = val_conversion.find(val);
            if (it != val_conversion.end())
            {
                strains[strainMap[i - 9]] = it->second;
            }
            else
            {
                strains[strainMap[i - 9]] = -1;
            }
        }
        // Write the data to the file
        stringstream ss;
        ss << Symbol << "," << chromosome << "," << position << ",\"{" << Consequence << "}\"";
        for (int i = 0; i < savedStrains.size(); i++)
        {
            ss << "," << strains[i];
        }
        ss << "\n";
        f << ss.str();
    }

    f.close();

    auto end_time = high_resolution_clock::now();
    auto duration = duration_cast<seconds>(end_time - start_time);
    cout << endl
         << "Finished parsing " << count << " lines in " << duration.count() << " seconds" << endl;

    cout << "Writing consequences to file" << endl;
    writeArrayToFile(consequencesPath, consq);
    cout << "Writing strains to file" << endl;
    writeArrayToFile(strainsPath, savedStrains);
    return;
}

int main(int argc, char **argv)
{
    if (argc < 2)
    {
        help();
        return 0;
    }

    string filePath = argv[1];
    string consequenceFile = "../web/public/data/consequences.json";
    string strainFile = "../web/public/data/strains.json";
    string outputFile = "output.csv";

    if (!ifstream(filePath))
    {
        cout << "Error: VCF file not found" << endl;
        return 0;
    }

    for (int i = 2; i < argc; i++)
    {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0)
        {
            help();
            return 0;
        }
        else if (strcmp(argv[i], "--consequence-file") == 0)
        {
            if (i + 1 >= argc)
            {
                cout << "Error: Missing consequence file" << endl;
                return 0;
            }
            string consqFile = argv[i + 1];
            consequenceFile = consqFile;
            i++;
        }
        else if (strcmp(argv[i], "--strain-file") == 0)
        {
            if (i + 1 >= argc)
            {
                cout << "Error: Missing strain file" << endl;
                return 0;
            }
            string strainFile = argv[i + 1];
            strainFile = strainFile;
            i++;
        } else if (strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--output") == 0)
        {
            if (i + 1 >= argc)
            {
                cout << "Error: Missing output file" << endl;
                return 0;
            }
            string outFile = argv[i + 1];
            outputFile = outFile;
            i++;
        } else if (strcmp(argv[i], "--debug") == 0)
        {
            debug = true;
        } else {
            cout << "Error: Unknown argument " << argv[i] << endl;
            return 0;
        }
    }

    if (!ifstream(consequenceFile))
    {
        cout << "Error: Consequence file not found" << endl;
        return 0;
    }

    if (!ifstream(strainFile))
    {
        cout << "Error: Strain file not found" << endl;
        return 0;
    }

    if (debug)
    {
        cout << "Debug mode enabled" << endl;
        cout << "VCF file: " << filePath << endl;
        cout << "Consequence file: " << consequenceFile << endl;
        cout << "Strain file: " << strainFile << endl;
        cout << "Output file: " << outputFile << endl;
    }
    parseVCF(filePath, consequenceFile, strainFile, outputFile);
    return 0;
}