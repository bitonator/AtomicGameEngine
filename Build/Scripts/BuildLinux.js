var fs = require('fs-extra');
var path = require("path");
var spawnSync = require('child_process').spawnSync
var host = require("./Host");
var atomicRoot = host.atomicRoot;

var buildDir = host.artifactsRoot + "Build/Linux/";
var editorAppFolder = host.artifactsRoot + "AtomicEditor/";

namespace('build', function() {

    // Builds a standalone Atomic Editor, which can be distributed out of build tree
    task('atomiceditor', {
        async: true
    }, function() {

        // Clean build
        var cleanBuild = true;
        if (cleanBuild) {
            common.cleanCreateDir(buildDir);
            common.cleanCreateDir(editorAppFolder);
            common.cleanCreateDir(host.getGenScriptRootDir("LINUX"));
        }

        var buildAtomicNET = false;

        // TODO: build box has old node
        if (spawnSync)
            buildAtomicNET = spawnSync("which", ["xbuild"]).status == 1 ? false : true;

        process.chdir(buildDir);

        var cmds = [];

        cmds.push("cmake ../../../ -DATOMIC_DEV_BUILD=0 -DCMAKE_BUILD_TYPE=Release");
        cmds.push("make -j2")

        if (buildAtomicNET)
          cmds.push(host.atomicTool + " net compile " + atomicRoot + "Script/AtomicNET/AtomicNETProject.json LINUX Release");

        jake.exec(cmds, function() {

            // Copy the Editor binaries
            fs.copySync(buildDir + "Source/AtomicEditor/AtomicEditor",
            host.artifactsRoot + "AtomicEditor/AtomicEditor");

            // We need some resources to run
            fs.copySync(atomicRoot + "Resources/CoreData",
            editorAppFolder + "Resources/CoreData");

            fs.copySync(atomicRoot + "Resources/PlayerData",
            editorAppFolder + "Resources/PlayerData");

            fs.copySync(atomicRoot + "Data/AtomicEditor",
            editorAppFolder + "Resources/ToolData");

            fs.copySync(atomicRoot + "Resources/EditorData",
            editorAppFolder + "Resources/EditorData");

            fs.copySync(atomicRoot + "Artifacts/Build/Resources/EditorData/AtomicEditor/EditorScripts",
            editorAppFolder + "Resources/EditorData/AtomicEditor/EditorScripts");

            fs.copySync(buildDir +  "Source/AtomicPlayer/Application/AtomicPlayer",
            editorAppFolder + "Resources/ToolData/Deployment/Linux/AtomicPlayer");

            // AtomicNET

            if (buildAtomicNET) {
              fs.copySync(atomicRoot + "Artifacts/AtomicNET/Release",
                 editorAppFolder + "Resources/ToolData/AtomicNET/Release");
            }

            var binaryFiles = ["chrome-sandbox", "libcef.so", "natives_blob.bin", "snapshot_blob.bin"];

            var resourceFiles = ["cef.pak",
            "cef_100_percent.pak",
            "cef_200_percent.pak",
            "cef_extensions.pak",
            "devtools_resources.pak",
            "icudtl.dat",
            "locales"];

            for (var i = 0; i < binaryFiles.length; i++) {
                fs.copySync(atomicRoot + "Submodules/CEF/Linux/Release/" + binaryFiles[i], editorAppFolder+"/" + binaryFiles[i]);
            }

            for (var i = 0; i < resourceFiles.length; i++) {
                fs.copySync(atomicRoot + "Submodules/CEF/Linux/Resources/" + resourceFiles[i], editorAppFolder+"/" + resourceFiles[i]);
            }


            console.log("\n\nAtomic Editor build to " + editorAppFolder + "\n\n");

            complete();

        }, {
            printStdout: true
        });

    });

});
