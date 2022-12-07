package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/otiai10/copy"
	"github.com/pierrre/archivefile/zip"
)

// BaseDir needs to be set to where the snd package is located.
var BaseDir = os.Getenv("SND_DIR")

// Go represents the chosen go executable.
var Go = "go"

// Build represents a build configuration.
type Build struct {
	Package         string
	Arch            string
	Arm             string
	OS              string
	Tags            string
	NameTag         string
	AdditionalFiles []string
}

// Builds represents the currently needed build configurations.
var Builds = []Build{
	// Electron
	{
		Package: "/cmd/app",
		Arch:    "amd64",
		OS:      "windows",
		Tags:    "ELECTRON LIBUSB",
		// Windows will be build with libusb support and needs the libusb-1.0.dll as additional file.
		// SND_LIBUSB_DLL should contain the file path of the libusb-1.0.dll.
		AdditionalFiles: []string{os.Getenv("SND_LIBUSB_DLL")},
		NameTag:         "gui",
	},
	{
		Package: "/cmd/app",
		Arch:    "amd64",
		OS:      "linux",
		Tags:    "ELECTRON",
		NameTag: "gui",
	},
	{
		Package: "/cmd/app",
		Arch:    "amd64",
		OS:      "darwin",
		Tags:    "ELECTRON",
		NameTag: "gui",
	},
	{
		Package: "/cmd/app",
		Arch:    "arm64",
		OS:      "darwin",
		Tags:    "ELECTRON",
		NameTag: "gui",
	},
	// Headless
	{
		Package: "/cmd/app",
		Arch:    "amd64",
		OS:      "linux",
		NameTag: "headless",
	},
	{
		Package: "/cmd/app",
		Arch:    "arm64",
		OS:      "linux",
		NameTag: "headless",
	},
	{
		Package: "/cmd/app",
		Arch:    "386",
		OS:      "linux",
		NameTag: "headless",
	},
	// RPI
	{
		Package: "/cmd/app",
		Arch:    "arm",
		Arm:     "7",
		OS:      "linux",
		NameTag: "headless_rpi",
	},
	{
		Package: "/cmd/app",
		Arch:    "arm",
		Arm:     "6",
		OS:      "linux",
		NameTag: "headless_rpi",
	},
}

// failOnErr will panic if err is not nil.
func failOnErr(err error) {
	if err != nil {
		panic(err)
	}
}

// getGitGo reads the go version and git commit + branch.
func getGitGo() (string, string, string) {
	goVersionCmd := exec.Command(Go, "version")
	goVersionCmd.Dir = BaseDir
	goVersion, err := goVersionCmd.CombinedOutput()
	failOnErr(err)

	gitCommitCmd := exec.Command("git", "rev-list", "-1", "HEAD")
	gitCommitCmd.Dir = BaseDir
	gitCommit, err := gitCommitCmd.CombinedOutput()
	failOnErr(err)

	gitBranchCmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	gitBranchCmd.Dir = BaseDir
	gitBranch, err := gitBranchCmd.CombinedOutput()
	failOnErr(err)

	return strings.Trim(string(goVersion), " \n\t"), strings.Trim(string(gitCommit), " \n\t"), strings.Trim(string(gitBranch), " \n\t")
}

// initialSetup removes old data and creates fresh directories to get into a clean state.
func initialSetup() {
	fmt.Println("Clearing old data...")

	failOnErr(os.RemoveAll(filepath.Join(BaseDir, "/frontend/dist")))
	failOnErr(os.RemoveAll(filepath.Join(BaseDir, "/frontend/.cache")))
	failOnErr(os.RemoveAll("./release"))
	failOnErr(os.RemoveAll("./cache"))

	_ = os.MkdirAll("./cache", 0777)
	_ = os.MkdirAll("./frontend/dist", 0777)
	_ = os.MkdirAll("./release/", 0777)
}

// runViteBuild will build the frontend and copy over the files.
func runViteBuild() {
	fmt.Println("Vite Out: ===============")
	cmd := exec.Command("npm", "run", "build")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Dir = filepath.Join(BaseDir, "/frontend/")
	err := cmd.Run()
	failOnErr(err)
	failOnErr(copy.Copy(filepath.Join(BaseDir, "/frontend/dist"), "./cache/frontend/dist"))
}

func main() {
	skipBuilds := flag.Bool("skip-builds", false, "only bundle frontend")
	only := flag.String("only", "", "only build certain platforms")
	flag.Parse()

	if len(BaseDir) == 0 {
		panic("S&D directory not defined!")
	}

	// Check if alternative go exectuable is set
	if len(os.Getenv("SND_GO")) > 0 {
		Go = os.Getenv("SND_GO")
	}

	goVersion, gitCommit, gitBranch := getGitGo()

	fmt.Println("Go Version :", goVersion)
	fmt.Println("Commit     :", gitCommit)
	fmt.Println("Branch     :", gitBranch)

	initialSetup()
	runViteBuild()

	cache, _ := filepath.Abs("./cache")

	//
	// Run the builds
	//

	ldflags := fmt.Sprintf("-X github.com/BigJk/snd.GitCommitHash=%s -X github.com/BigJk/snd.GitBranch=%s -X github.com/BigJk/snd.BuildTime=%s", gitCommit, gitBranch, time.Now().Format(time.RFC3339))
	if !*skipBuilds {
		for i, b := range Builds {
			if len(*only) > 0 && !strings.Contains(b.Arch+b.OS, *only) {
				fmt.Printf("=========================== [%s-%s]\n", b.OS, b.Arch)
				fmt.Println("Skipping...")
				fmt.Println("===========================")
				continue
			}

			// Format target name
			target := fmt.Sprintf("./release/snd_%s_%s%s_%s_%s", b.OS, b.Arch, b.Arm, b.NameTag, gitCommit[0:7])

			// Check for windows if .exe is needed
			ext := ""
			if b.OS == "windows" {
				ext = ".exe"
			}

			// Create needed directories
			_ = os.MkdirAll(target, 0777)
			_ = os.MkdirAll(filepath.Join(target, "/data"), 0777)
			_ = os.MkdirAll(filepath.Join(cache, fmt.Sprintf("build-%d", i)), 0777)

			_ = copy.Copy(fmt.Sprintf("./res/%s-%s", b.OS, b.Arch), target)
			_ = copy.Copy("./cache/frontend/", filepath.Join(target, "/frontend"))
			_ = copy.Copy("./data/icon.png", filepath.Join(target, "/data/icon.png"))
			_ = ioutil.WriteFile(filepath.Join(target, "/version.txt"), []byte(fmt.Sprintf("Commit: %s\nBranch: %s\nBuild Time: %s", gitCommit, gitBranch, time.Now().Format(time.RFC3339))), 0666)

			fmt.Printf("=========================== [%s-%s]\n", b.OS, b.Arch)

			// Run go build
			cmd := exec.Command(Go, "build", "-ldflags", ldflags, "-o", "Sales & Dungeons"+ext, "-tags", b.Tags)
			cmd.Env = append(cmd.Env, []string{
				"PATH=" + os.Getenv("PATH"),
				"GOOS=" + b.OS,
				"GOARCH=" + b.Arch,
				"GOCACHE=" + filepath.Join(cache, fmt.Sprintf("build-%d", i)),
				"GOTMPDIR=" + filepath.Join(cache, fmt.Sprintf("build-%d", i)),
				"GOPATH=" + os.Getenv("GOPATH"),
				"GOROOT=" + os.Getenv("GOROOT"),
				"PKG_CONFIG_PATH=" + os.Getenv("PKG_CONFIG_PATH"),
			}...)
			cmd.Dir = filepath.Join(BaseDir, b.Package)
			buildOutput, err := cmd.CombinedOutput()
			fmt.Println("Output:", strings.Trim(string(buildOutput), " \n\t"))
			failOnErr(err)

			// Copy over the executable and additional files
			fmt.Println("Copy executable...")
			data, err := ioutil.ReadFile(filepath.Join(cmd.Dir, "/Sales & Dungeons"+ext))
			failOnErr(err)
			failOnErr(ioutil.WriteFile(filepath.Join(target, "/Sales & Dungeons"+ext), data, 0666))

			if len(b.AdditionalFiles) > 0 {
				for i := range b.AdditionalFiles {
					failOnErr(copy.Copy(b.AdditionalFiles[i], filepath.Join(target, filepath.Base(b.AdditionalFiles[i]))))
				}
			}

			// Delete old file
			_ = os.Remove(filepath.Join(cmd.Dir, "/Sales & Dungeons"+ext))

			// Create .zip archive
			fmt.Println("Start compressing...")
			file, err := os.Create(target + ".zip")
			failOnErr(err)
			failOnErr(zip.Archive(target, file, nil))
			failOnErr(file.Close())

			fmt.Println("===========================")
		}
	}

	// Create a release just containing the frontend
	targetFrontend := fmt.Sprintf("./release/snd_%s_%s", "frontend", gitCommit[0:7])
	file, err := os.Create(targetFrontend + ".zip")
	failOnErr(err)
	failOnErr(zip.Archive("./cache/frontend", file, nil))
	failOnErr(file.Close())

	// Delete cache directory
	_ = os.RemoveAll("./cache")
}
