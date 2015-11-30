#!/usr/bin/env python

import json, getpass, os.path, copy

def isJson(jsonString):
	if jsonString == '':
		return False

	try:
		json_object = json.loads(jsonString)
	except ValueError, e:
		return False
	return True


print "Registry Alert Setup"
print " "

# If 'config.json' exists, load the values
defaults = {
	'smtp': {
		'username': '',
		'password': '',
		'from': '',
		'to': ''
	}
}

configExists = False

if os.path.exists('config.json'):
	jsonData = open('config.json', 'r').read()
	if isJson(jsonData):
		defaults = json.loads(jsonData)
		configExists = True

defaultsDisplay = copy.deepcopy(defaults)
defaultsDisplay['smtp']['password'] = '***'

smtpUsername = raw_input("Enter the SMTP username (" + defaultsDisplay['smtp']['username'] + "): ")
smtpPassword = getpass.getpass("Enter the SMTP password (" + defaultsDisplay['smtp']['password'] + "): ")
smtpFrom = raw_input("Enter the 'From' address (" + defaultsDisplay['smtp']['from'] + "): ")
smtpTo = raw_input("Enter the 'To' address (" + defaultsDisplay['smtp']['to'] + "): ")

currentInventoryResponse = raw_input("Do you have a current 'inventory.json' file to import? (y/N): ")

if configExists:
	if smtpUsername == '':
		smtpUsername = defaults['smtp']['username']
	if smtpPassword == '':
		smtpPassword = defaults['smtp']['password']
	if smtpFrom == '':
		smtpFrom = defaults['smtp']['from']
	if smtpTo == '':
		smtpTo = defaults['smtp']['to']


if currentInventoryResponse.lower() == 'y':
	jsonString = raw_input("Enter the JSON string as one line here: ")
	if isJson(jsonString) == False:
		print "Invalid JSON string. You can re-run this script to import the 'inventory.json' file again."
		jsonString = ''


options = {
	'smtp': {
		'username': smtpUsername,
		'password': smtpPassword,
		'from': smtpFrom,
		'to': smtpTo
	}
}

with open('config.json', 'w') as outfile:
	json.dump(options, outfile)
