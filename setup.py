#!/usr/bin/env python

import json, getpass

print "Registry Alert Setup"
print " "

smtpUsername = raw_input("Enter the SMTP username (): ")
smtpPassword = getpass.getpass("Enter the SMTP password (): ")
smtpFrom = raw_input("Enter the 'From' address (registry-alert@mountyscorner.com): ")
smtpTo = raw_input("Enter the 'To' address (): ")

currentInventoryResponse = raw_input("Do you have a current 'inventory.json' file to import? (y/N): ")

if smtpFrom == '':
	smtpFrom = 'registry-alert@mountyscorner.com'

if currentInventoryResponse.lower() == 'y':
	# have the user paste the raw json here

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
