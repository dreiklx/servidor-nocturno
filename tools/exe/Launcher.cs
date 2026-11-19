// Servidor Nocturno · lanzador portable para Windows (NYDER Games)
// Un solo .exe con el juego adentro (recursos embebidos). Al abrirlo:
//  1) sirve los archivos en http://localhost:47821/ (puerto fijo: así el guardado no se pierde);
//  2) abre Microsoft Edge en modo aplicación con un perfil propio;
//  3) al cerrar la ventana del juego, se cierra el servidor.
// Se compila con el csc.exe de .NET Framework que ya trae Windows (tools/exe/build_exe.ps1).
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

static class Launcher
{
    const int Port = 47821;
    static readonly Dictionary<string, string> Types = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        {".html","text/html; charset=utf-8"}, {".js","text/javascript; charset=utf-8"}, {".css","text/css; charset=utf-8"},
        {".json","application/json"}, {".webmanifest","application/manifest+json"}, {".png","image/png"},
        {".wav","audio/wav"}, {".mp3","audio/mpeg"}, {".ttf","font/ttf"}, {".txt","text/plain; charset=utf-8"}
    };

    [STAThread]
    static void Main(string[] args)
    {
        string url = "http://localhost:" + Port + "/index.html";
        HttpListener listener = new HttpListener();
        listener.Prefixes.Add("http://localhost:" + Port + "/");
        bool serving = true;
        try { listener.Start(); }
        catch (HttpListenerException) { serving = false; } // ya hay otra copia abierta: solo abrir la ventana

        if (serving) { Thread t = new Thread(() => Serve(listener)); t.IsBackground = true; t.Start(); }
        // modo de prueba: solo sirve los archivos unos segundos, sin abrir ventanas
        if (args.Length > 0 && args[0] == "--prueba") { Thread.Sleep(int.Parse(args.Length > 1 ? args[1] : "15") * 1000); if (serving) listener.Stop(); return; }

        string edge = FindEdge();
        string profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NYDER Games", "ServidorNocturno");
        Directory.CreateDirectory(profile);
        if (edge != null)
        {
            ProcessStartInfo psi = new ProcessStartInfo(edge, "--app=" + url + " --user-data-dir=\"" + profile + "\" --no-first-run --start-maximized --autoplay-policy=no-user-gesture-required");
            psi.UseShellExecute = false;
            Process p = Process.Start(psi);
            if (serving) { p.WaitForExit(); WaitForProfileClose(profile); }
        }
        else
        {
            Process.Start(url);
            if (serving) MessageBox.Show("Servidor Nocturno está abierto en su navegador.\n\nCuando termine de jugar, presione Aceptar para cerrar el juego.", "Servidor Nocturno · NYDER Games");
        }
        if (serving) listener.Stop();
    }

    // Edge puede pasar la ventana a otro proceso; se espera mientras el perfil siga en uso.
    static void WaitForProfileClose(string profile)
    {
        string lockFile = Path.Combine(profile, "lockfile");
        for (int i = 0; i < 60 * 60 * 12; i++)
        {
            if (!File.Exists(lockFile)) return;
            try { using (File.Open(lockFile, FileMode.Open, FileAccess.ReadWrite, FileShare.None)) { } return; }
            catch (IOException) { Thread.Sleep(1000); }
        }
    }

    static string FindEdge()
    {
        string[] c = {
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86) + @"\Microsoft\Edge\Application\msedge.exe",
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) + @"\Microsoft\Edge\Application\msedge.exe",
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\Microsoft\Edge\Application\msedge.exe" };
        foreach (string p in c) if (File.Exists(p)) return p;
        return null;
    }

    static void Serve(HttpListener l)
    {
        Assembly asm = Assembly.GetExecutingAssembly();
        while (l.IsListening)
        {
            HttpListenerContext ctx;
            try { ctx = l.GetContext(); } catch { return; }
            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    string path = Uri.UnescapeDataString(ctx.Request.Url.AbsolutePath).TrimStart('/');
                    if (path == "") path = "index.html";
                    // los recursos se embeben con el nombre "game/<ruta con />"
                    Stream s = asm.GetManifestResourceStream("game/" + path);
                    if (s == null) { ctx.Response.StatusCode = 404; ctx.Response.Close(); return; }
                    string ext = Path.GetExtension(path);
                    ctx.Response.ContentType = Types.ContainsKey(ext) ? Types[ext] : "application/octet-stream";
                    ctx.Response.ContentLength64 = s.Length;
                    ctx.Response.AddHeader("Cache-Control", "no-cache");
                    s.CopyTo(ctx.Response.OutputStream);
                    s.Dispose();
                    ctx.Response.OutputStream.Close();
                }
                catch { try { ctx.Response.Abort(); } catch { } }
            });
        }
    }
}
