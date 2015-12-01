#!/usr/bin/env python

import json, getpass, os.path

def isJson(jsonString):
	if jsonString == '':
		return False

	try:
		json_object = json.loads(jsonString)
	except ValueError, e:
		return False
	return True

def getJsonFile(path):
	if os.path.exists(path):
		with open(path, 'r') as infile:
			jsonData = infile.read()
		return json.loads(jsonData)
	else:
		raise ValueError("Path '%s' does not exist." % path)

def writeJsonFile(path, data):
	with open(path, 'w') as outfile:
		json.dump(data, outfile)
	return True

configOptions = getJsonFile('setup.py.json')

# create a default config dict from the config options
options = {}
for section in configOptions['sections']:
	thisSection = {}
	for var in section['vars']:
		thisSection[var['name']] = var['defaultValue']
	options[section['name']] = thisSection

# check for a currently existing config file
try:
	options = getJsonFile('config.json')
except ValueError:
	# ignore a missing file
	pass

print "Registry Alert Setup"
print ""

# loop through the config options again and ask for inputs
for section in configOptions['sections']:
	print section['display']
	for var in section['vars']:
		askString = var['prompt'] + " (%s): "
		display = options[section['name']][var['name']]
		if var['secure']:
			display = var['secureDisplay']
			response = getpass.getpass(askString % display)
		else:
			response = raw_input(askString % display)

		if response != '':
			options[section['name']][var['name']] = response
	print ""

# write the new options to disk
writeJsonFile('config.json', options)

# report back
print "config.json file successfully written."
print ""

# check if the user has an existing inventory string to import.
print "[Inventory import]"
currentInventoryResponse = raw_input("Do you have a current 'inventory.json' file to import? (y/N): ")
if currentInventoryResponse.lower() == 'y':
	jsonString = raw_input("Enter or paste the JSON string as one line here: ")
	if isJson(jsonString):
		with open('inventory.json', 'w') as outfile:
			outfile.write(jsonString)
	else:
		print "Invalid JSON string. You can re-run this script to import the 'inventory.json' file again."
