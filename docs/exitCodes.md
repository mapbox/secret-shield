## Secret-shield exit codes

Secret-shield has a number of exit codes corresponding to different errors.

Number | Code | Component | Details
--- | --- | --- | ---
0 | | | success
1 | SECRET_FOUND | preCommit | secret-shield found a secret
32 | CLONE_FAIL | searchRepo | git clone failed
33 | READ_FAIL | searchRepo | failed to read files
49 | DIR_READ_FAIL | searchDirectory | failed to read directory
50 | DIR_SEARCH_FAIL | searchDirectory | search failed because of an unknown error
55 | FILE_READ_FAIL | analyzer.js | could not read file
64 | PREPROC_FAIL | searchString | string preprocessor failed
65 | MAINPROC_FAIL | searchString | string search main processor failed
66 | POSTPROC_FAIL | searchString | string search postprocessor failed
96 | GLOBAL_HOOK_REMOVE_FAIL | removeHooks | could not remove global hooks because of an unknown git error
97 | NO_GLOBAL_HOOK | removeHooks | could not remove nonexistent global hooks
98 | NO_LOCAL_HOOK | removeHooks | could not remove nonexistent local hooks
99 | LOCAL_HOOK_REMOVE_FAIL | removeHooks | could not delete local hooks file
110 | NPM_FAIL | update | NPM failed
111 | UPDATE_FAIL | update | failed to update secret-shield to the latest version
112 | HOOK_UPDATE_FAIL | update | failed to update the hooks path following a secret-shield update
125 | PRE_COMMIT_SEARCH_FAIL | preCommit | search failed because of an unknown error
126 | GIT_DIFF_FILE_FAIL | preCommit | git diff failed to run for an individual file
127 | GIT_DIFF_NAME_FAIL | preCommit | git diff name-status failed
128 | NOT_A_REPO | | you're not in a git repository
129 | NO_LOCAL_HOOK_ADD | addHooks | could not find the local hook file to add
130 | LOCAL_HOOK_EXIST | addHooks | local hook already exists
131 | LOCAL_HOOK_ADD_COPY_FAIL | addHooks | failed to copy over the local hook file
132 | LOCAL_HOOK_ADD_CHMOD_FAIL | addHooks | could not make local hooks executable
133 | GLOBAL_HOOK_ADD_FAIL | addHooks | could not add global hooks due to an unknown git error
216 | CF_TEMPLATE_PARSE_FAIL | searchCFTemplate | failed to parse the CloudFormation template
250 | NOT_IMPLEMENTED | | functionality is not implemented yet (or ever)
251 | DEPRECATED | | functionality is deprecated
254 | MISSING_ARGS | | missing command line arguments
255 | WRONG_ARGS | | wrong command line arguments
