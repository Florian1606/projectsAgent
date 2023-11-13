import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';

const toExclude = ["node_modules","projetsAgent"]

function identifyProjects(directory) {
	const projects = [];

	function scanDirectory(currentDir) {
		const files = fs.readdirSync(currentDir);

		for (const file of files) {
			const filePath = path.join(currentDir, file);
			const isDirectory = fs.statSync(filePath).isDirectory();

			if (isDirectory) {
				if (toExclude.every(exclude => !filePath.includes(exclude))) {
					if (fs.existsSync(path.join(filePath, 'pom.xml')) || fs.existsSync(path.join(filePath, 'build.gradle'))) {
						projects.push({ type: 'Java', path: filePath });
					} else if (fs.readdirSync(filePath).some(f => f.endsWith('.c'))) {
						projects.push({ type: 'C', path: filePath });
					} else if (fs.readdirSync(filePath).some(f => f.endsWith('.cpp'))) {
						projects.push({ type: 'C++', path: filePath });
					} else if (fs.existsSync(path.join(filePath, 'CMakeLists.txt'))) {
						projects.push({ type: 'C++ (CMake)', path: filePath });
					} else if (fs.existsSync(path.join(filePath, 'Makefile'))) {
						projects.push({ type: 'C/C++ (Makefile)', path: filePath });
					} else if (fs.existsSync(path.join(filePath, 'Package.json'))) {
						projects.push({ type: 'NPM', path: filePath });
					}
				}
				scanDirectory(filePath);
			}
		}
	}

	scanDirectory(directory);
	return projects;
}

const targetDirectory = '..';

const projects = identifyProjects(targetDirectory);

const projectChoices = projects.map(project => ({
	name: `${getProjectIcon(project.type)} ${project.type} - ${project.path}`,
	value: project,
}));

function getProjectIcon(projectType) {
	switch (projectType) {
		case 'NPM':
			return chalk.green('⨁');
		case 'Java':
			return chalk.yellow('☕️');
		case 'C':
			return chalk.cyan('C');
		case 'C++':
			return chalk.blue('C++');
		case 'C++ (CMake)':
			return chalk.magenta('C++ (CMake)');
		case 'C/C++ (Makefile)':
			return chalk.green('C/C++ (Makefile)');
		default:
			return ' ';
	}
}

inquirer
	.prompt([
		{
			type: 'list',
			name: 'selectedProject',
			message: 'Select a project to open in VSCode:',
			choices: projectChoices,
			loop: false,
			
		},
	])
	.then(answers => {
		const selectedProject = answers.selectedProject;
		const projectPath = selectedProject.path;

		// Open project in vscode
		exec(`code ${projectPath}`, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error when opening the project in VSCode: ${error}`);
			} else {
				console.log(`Project open in VSCode: ${projectPath}`);
			}
		});
	});
